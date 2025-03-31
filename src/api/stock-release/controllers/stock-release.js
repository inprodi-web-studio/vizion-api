const { STOCK_RELEASE, STOCK_RESERVATION, STOCK_DISPATCH } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const stock = require('../../stock/controllers/stock');
const { validateReserve, validateRelease } = require('../content-types/stock-release/stock-release.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const releaseFields = {
    fields : ["uuid", "quantity", "realQuantity", "releaseDate", "isCompleted"],
    populate : {
        product : {
            select : ["uuid", "name", "sku", "type"],
            populate : {
                images : {
                    select : ["url"],
                },
                stockInfo : true,
            },
        },
        unity : {
            fields : ["uuid", "name", "abbreviation"],
        },
        package : {
            fields : ["uuid", "conversionRate", "realConversion"],
            populate : {
                unity : true,
            },
        },
        variation : {
            fields : ["uuid", "sku"],
            populate : {
                values : {
                    fields : ["uuid", "name"],
                    populate : {
                        attribute : {
                            fields : ["uuid", "name"],
                        },
                    },
                },
            },
        },
        sale : {
            fields : ["uuid", "fol", "subject"],
            populate : {
                warehouse : {
                    fields : ["uuid", "layout"],
                },
            },
        },
        reservations : {
            fields : ["uuid", "quantity"],
            populate : {
                stock : {
                    fields : ["uuid", "quantity", "packageQuantity", "positionPartition"],
                    populate : {
                        location : {
                            fields : ["uuid", "name"]
                        },
                        badge : {
                            fields : ["uuid", "name", "expirationDate"]
                        },
                        unity : {
                            fields : ["uuid", "name", "abbreviation"]
                        },
                        package : {
                            fields : ["uuid", "conversionRate", "realConversion"],
                            populate : {
                                unity : {
                                    fields : ["uuid", "name", "abbreviation"]
                                }
                            },
                        },
                        position : {
                            fields : ["uuid", "xPosition", "yPosition"],
                            populate : {
                                shelf : {
                                    fields : ["uuid", "name"]
                                }
                            },
                        },
                    },
                },
                dispatches : {
                    fields : ["uuid", "quantity"],
                },
            },
        },
        dispatches : {
            fields : ["uuid", "quantity"],
            populate : {
                reservations : {
                    fields : ["uuid", "quantity"],
                },
            },
        },
    },
};

module.exports = createCoreController( STOCK_RELEASE, ({ strapi }) => ({
    async find(ctx) {
        const company = ctx.state.company;

        const filters = {
            $search : [
                "product.name",
                "product.sku",
                "variation.sku",
            ],
            sale : {
                company : company.id
            },
        };

        const releases = await findMany( STOCK_RELEASE, releaseFields, filters, false );

        return releases;
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;

        const release = await findOneByUuid( uuid, STOCK_RELEASE, releaseFields );

        return release;
    },

    async reserveStock(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateReserve( data );

        const release = await findOneByUuid( uuid, STOCK_RELEASE, releaseFields );

        if ( release.isCompleted ) {
            throw new BadRequestError( "Cannot reserve a completed release", {
                key : "stock-release.completed",
                path : ctx.request.url,
            });
        }

        const totalReserved = release.reservations.reduce((acc, r) => {
            return acc + r.quantity;
        }, 0);

        const quantity = release.package ? release.realQuantity : release.quantity;

        if ( totalReserved + data.quantity > quantity ) {
            throw new BadRequestError( "Cannot reserve more stock than the reserved quantity", {
                key : "stock-reservation.quantityExceeded",
                path : ctx.request.url,
            });
        }

        release.toReserve = data.quantity;

        await strapi.service( STOCK_RESERVATION ).registerReservations([release], release.id);

        return release;
    },

    async releaseStock(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateRelease( data );

        const release = await findOneByUuid( uuid, STOCK_RELEASE, releaseFields );

        if ( release.isCompleted ) {
            throw new BadRequestError( "Cannot release a completed release", {
                key : "stock-release.completed",
                path : ctx.request.url,
            });
        }

        const totalReleased = release.dispatches.reduce((acc, d) => {
            return acc + d.quantity;
        }, 0);

        const quantity = release.package ? release.realQuantity : release.quantity;

        if ( totalReleased + data.quantity > quantity ) {
            throw new BadRequestError( "Cannot release more stock than the released quantity", {
                key : "stock-release.quantityExceeded",
                path : ctx.request.url,
            });
        }

        
        let { reservations, remaining } = await strapi.service(STOCK_DISPATCH).calculateReservationDistribution(release, data.quantity);

        if (remaining > 0) {
            release.toReserve = remaining;

            await strapi.service( STOCK_RESERVATION ).registerReservations([release], release.id);

            const newRelease = await findOneByUuid( uuid, STOCK_RELEASE, releaseFields );

            ({ reservations, remaining } = await strapi.service(STOCK_DISPATCH).calculateReservationDistribution(newRelease, data.quantity));
        }

        const newDispatch = await strapi.entityService.create( STOCK_DISPATCH, {
            data : {
                reservations : reservations,
                quantity : data.quantity,
                isCompleted : false
            },
        });

        const isCompleted = totalReleased + data.quantity === release.quantity;

        const updatedRelease = await strapi.entityService.update( STOCK_RELEASE, release.id, {
            data : {
                dispatches : {
                    connect : [newDispatch.id],
                },
                isCompleted,
            },
            ...releaseFields
        });

        return updatedRelease;
    },
}));