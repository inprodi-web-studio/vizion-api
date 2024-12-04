const { STOCK_MOVEMENT, STOCK, STOCK_LOCATION } = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateCreateAdjustment, validateCreateReubication } = require("../content-types/stock-movement/stock-movement.validation");

const { createCoreController } = require('@strapi/strapi').factories;

const movementsField = {
    fields : ["uuid", "quantity", "type", "comments", "packageQuantity", "positionPartition", "createdAt"],
    populate : {
        product : {
            fields : ["uuid", "name", "sku", "type"],
        },
        motive : {
            fields : ["uuid", "title"],
        },
        badge : {
            fields : ["uuid", "name", "expirationDate"],
        },
        variation : {
            fields : ["uuid", "name", "sku"],
            populate : {
                values : {
                    fields : ["uuid", "name"],
                    populate : {
                        attribute : {
                            fields : ["uuid", "name"],
                        },
                    },
                }
            },
        },
        unity : {
            fields : ["uuid", "name", "abbreviation"],
        },
        package : {
            fields : ["uuid", "conversionRate", "realConversion"],
            populate : {
                unity : {
                    fields : ["uuid", "name", "abbreviation"],
                }
            },
        },
        position : {
            fields : ["uuid", "xPosition", "yPosition", "rotation", "partitions"],
            populate : {
                shelf : {
                    fields : ["uuid", "name", "xPositions", "yPositions"],
                },
            }
        },
    },
};

module.exports = createCoreController(STOCK_MOVEMENT, ({ strapi }) => ({
    async find(ctx) {
        const { locationUuid } = ctx.params;

        const location = await findOneByUuid( locationUuid, STOCK_LOCATION );

        const filters = {
            $search : [
                "product.name",
                "product.sku",
                "variation.sku",
            ],
            location : location.id,
        };

        const movements = await findMany( STOCK_MOVEMENT, movementsField, filters );

        return movements;
    },

    async createAdjustment(ctx) {
        const data = ctx.request.body;

        await validateCreateAdjustment(data);

        const { createdBadges } = await strapi.service( STOCK_MOVEMENT ).validateAdjustmentParallelData( data );

        await strapi.service( STOCK_MOVEMENT ).handleAdjustment( data, createdBadges );

        return "success";
    },

    async createRelocation (ctx) {
        const data = ctx.request.body;

        await validateCreateReubication(data);

        await strapi.service( STOCK_MOVEMENT ).validateAdjustmentParallelData( data );

        await strapi.service( STOCK_MOVEMENT ).handleRelocation( data );

        return "success";
    },
}));
