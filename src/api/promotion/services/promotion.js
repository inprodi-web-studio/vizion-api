const { PROMOTION } = require('../../../constants/models');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService( PROMOTION, ({ strapi }) => ({
    async getStats() {
        const ctx = strapi.requestContext.get();
        const { company } = ctx.state;

        const active = await strapi.query(PROMOTION).count({
            where: {
                isActive: true,
                company: company.id,
            },
        });

        const inactive = await strapi.query(PROMOTION).count({
            where: {
                isActive: false,
                company: company.id,
            },
        });

        return { active, inactive };
    },
}));
