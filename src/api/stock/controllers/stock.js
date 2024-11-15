const { STOCK } = require('../../../constants/models');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(STOCK, ({ strapi }) => ({
    async find(ctx) {
        
    },
}));
