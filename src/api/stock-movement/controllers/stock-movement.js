const { STOCK_MOVEMENT, STOCK } = require("../../../constants/models");
const { validateCreateAdjustment, validateCreateReubication } = require("../content-types/stock-movement/stock-movement.validation");

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(STOCK_MOVEMENT, ({ strapi }) => ({
    async find(ctx) {

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
