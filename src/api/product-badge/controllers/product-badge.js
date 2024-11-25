const { PRODUCT_BADGE, PRODUCT, PRODUCT_VARIATION } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(PRODUCT_BADGE, ({ strapi }) => ({
    async find(ctx) {
        const { productUuid, variationUuid } = ctx.params;

        let filters = {};

        if (productUuid) {
            const product = await findOneByUuid( productUuid, PRODUCT );

            filters = {
                product : product.id,
            };
        }

        if (variationUuid) {
            const variation = await findOneByUuid( variationUuid, PRODUCT_VARIATION );

            filters = {
                variation : variation.id,
            };
        }

        const badges = await findMany( PRODUCT_BADGE, {}, filters );

        return badges;
    },
}));
