const { PACKAGE, UNITY } = require('../../../constants/models');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(PACKAGE, ({ strapi }) => ({
    async validateParallelData( data ) {
        const { id : packageId } = await findOneByUuid( data.unity, UNITY );

        data.unity = packageId;

        if ( data.referenceUnity ) {
            const { id : referenceUnityId, realConversion } = await findOneByUuid( data.referenceUnity, PACKAGE );

            data.referenceUnity = referenceUnityId;
            data.realConversion = realConversion * data.conversionRate;
        } else {
            data.realConversion = data.conversionRate;
        }
    },
}));
