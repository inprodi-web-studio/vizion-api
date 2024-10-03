const { PRODUCT_ATTRIBUTE, ATTRIBUTE_VALUE } = require('../../../constants/models');
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
}));
