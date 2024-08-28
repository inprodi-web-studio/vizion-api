const { PRODUCT_VARIATION, ATTRIBUTE_VALUE } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(PRODUCT_VARIATION, ({ strapi }) => ({
    async validateParallelData( data ) {
        let name = "";

        for ( let i = 0; i < data.values.length; i++ ) {
            const { id : valueId, name : valueName } = await findOneByUuid( data.values[i], ATTRIBUTE_VALUE );

            data.values[i] = valueId;

            if ( name ) {
                name = `${name} / ${valueName}`;
            } else {
                name = valueName;
            }
        }

        await checkForDuplicates( PRODUCT_VARIATION, [
            {
                sku : data.sku,
            },
            {
                name,
            },
        ], {}, false);

        data.name = name;
    },
}));
