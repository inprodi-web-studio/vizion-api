const { PRODUCT_VARIATION, ATTRIBUTE_VALUE } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(PRODUCT_VARIATION, ({ strapi }) => ({
    async validateParallelData( data ) {
        let name = "";

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
