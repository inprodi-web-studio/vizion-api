const { PRODUCT_ATTRIBUTE, ATTRIBUTE_VALUE, PRODUCT_VARIATION } = require('../../../constants/models');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(PRODUCT_ATTRIBUTE, ({ strapi }) => ({
    async validateParallelData(data) {
        const { id : attributeId } = await findOneByUuid( data.attribute, PRODUCT_ATTRIBUTE );
        data.attribute = attributeId;

        for ( let i = 0; i < data.values.length; i++ ) {
            const { id : valueId } = await findOneByUuid( data.values[i], ATTRIBUTE_VALUE );

            data.values[i] = valueId;
        }
    },

    async removeVariationsByAttribute(productId, attributeUuid) {
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
