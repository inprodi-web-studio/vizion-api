const { STOCK_DISPATCH } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');

const { createCoreController } = require('@strapi/strapi').factories;

const dispatchFields = {
    fields : ["uuid", "quantity"],
    populate : {
        reservations : {
            fields : ["uuid", "quantity", "isPicked"],
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
        release : {
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
                dispatches : {
                    fields : ["uuid", "quantity"],
                    populate : {
                        reservations : {
                            fields : ["uuid", "quantity", "isPicked"],
                        },
                    },
                },
            },
        },
    },
};

module.exports = createCoreController(STOCK_DISPATCH, ({ strapi }) => ({
    async find(ctx) {
        const company = ctx.state.company;

        const filters = {
            $search : [
                "quantity",
                "release.product.name",
                "release.product.sku",
                "release.variation.sku",
            ],
            release : {
                sale : {
                    company : company.id
                },
            }
        };

        const dispatches = await findMany( STOCK_DISPATCH, dispatchFields, filters, false );

        return dispatches;
    },
}));
