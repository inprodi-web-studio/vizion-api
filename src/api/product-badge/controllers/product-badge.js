const { PRODUCT_BADGE, PRODUCT, PRODUCT_VARIATION } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreController } = require('@strapi/strapi').factories;

const badgeFields = {
    fields : ["uuid", "name", "expirationDate"],
};

module.exports = createCoreController(PRODUCT_BADGE, ({ strapi }) => ({
    async find(ctx) {
        const { productUuid, variationUuid } = ctx.params;

        let filters = {
            $search : [
                "name",
            ]
        };

        if (productUuid) {
            const product = await findOneByUuid( productUuid, PRODUCT );

            filters.product = product.id;
        }

        if (variationUuid) {
            const variation = await findOneByUuid( variationUuid, PRODUCT_VARIATION );

            filters.variation = variation.id;
        }

        const badges = await findMany( PRODUCT_BADGE, badgeFields, filters, false );

        return badges;
    },
}));
