const { PRODUCT_VARIATION, ATTRIBUTE_VALUE } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(PRODUCT_VARIATION, ({ strapi }) => ({
    async validateParallelData( data ) {
        const ctx = strapi.requestContext.get();
        const { company } = ctx.state;

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
                product : {
                    company : company.id,
                },
            },
            {
                name,
                product : {
                    company : company.id,
                },
            },
        ], {}, false);

        data.name = name;
    },
}));
