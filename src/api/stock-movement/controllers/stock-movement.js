const { STOCK_MOVEMENT } = require("../../../constants/models");
const { BadRequestError } = require("../../../helpers/errors");
const { validateCreateAdjustment } = require("../content-types/stock-movement/stock-movement.validation");

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(STOCK_MOVEMENT, ({ strapi }) => ({
    async find(ctx) {

    },

    async createAdjustment(ctx) {
        const data = ctx.request.body;

        await validateCreateAdjustment(data);

        await strapi.service( STOCK_MOVEMENT ).validateAdjustmentParallelData( data );

        await strapi.service( STOCK_MOVEMENT ).handleAdjustment( data );

        return "success";
    },
}));
