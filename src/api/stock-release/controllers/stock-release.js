const { STOCK_RELEASE, STOCK_RESERVATION } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const stock = require('../../stock/controllers/stock');
const { validateReserve } = require('../content-types/stock-release/stock-release.validation');

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
        },
        reservations : {
            fields : ["uuid", "quantity"],
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

        if ( totalReserved + data.quantity > release.quantity ) {
            throw new BadRequestError( "Cannot reserve more stock than the release quantity", {
                key : "stock-reservation.quantityExceeded",
                path : ctx.request.url,
            });
        }

        release.toReserve = data.quantity;

        await strapi.service( STOCK_RESERVATION ).registerReservations([release], release.id);

        const newRelease = await findOneByUuid( uuid, STOCK_RELEASE, releaseFields );

        const newTotalReserved = newRelease.reservations.reduce((acc, r) => {
            return acc + r.quantity;
        }, 0);

        if ( newTotalReserved === release.quantity ) {
            const updatedRelease = await strapi.entityService.update( STOCK_RELEASE, release.id, {
                data : {
                    isCompleted : true,
                },
                ...releaseFields
            });

            return updatedRelease;
        }

        return newRelease;
    },
}));