const { ATTRIBUTE_VALUE, PRODUCT_VARIATION } = require('../../../constants/models');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(ATTRIBUTE_VALUE, ({ strapi }) => ({
    async removeVariationsByValue(productId, attributeUuid) {
        const variations = await strapi.entityService.findMany(PRODUCT_VARIATION, {
            filters : { 
                product : productId,
                values : {
                    attribute : {
                        uuid : attributeUuid,
                    },
                },
            },
        });

        const promises = [];

        for ( const variation of variations ) {
            promises.push( strapi.entityService.delete(PRODUCT_VARIATION, variation.id) );
        }

        await Promise.all( promises );
    },
}));
