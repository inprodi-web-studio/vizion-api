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

        if (data.package) {
            const { id : packageId } = await findOneByUuid( data.package, PACKAGE );

            data.package = packageId;
        }
    },

    async updateReferencedPackages( data, package ) {
        const packagesWithReference = await strapi.query( PACKAGE ).findMany({
            where : {
                referenceUnity : package.id,
            },
        });

        let promises = [];

        for ( let i = 0; i < packagesWithReference.length; i++ ) {
            const item = packagesWithReference[i];

            promises.push(
                strapi.entityService.update( PACKAGE, item.id, {
                    data : {
                        realConversion : item.conversionRate * data.conversionRate,
                    },
                })
            );
        }

        await Promise.all( promises );
    },

    async updateOrphanPackages(package) {
        const packagesWithReference = await strapi.query( PACKAGE ).findMany({
            where : {
                referenceUnity : package.id,
            },
        });

        let promises = [];

        for ( let i = 0; i < packagesWithReference.length; i++ ) {
            const item = packagesWithReference[i];

            promises.push(
                strapi.entityService.update( PACKAGE, item.id, {
                    data : {
                        conversionRate : item.realConversion,
                    },
                })
            );
        }

        await Promise.all( promises );
    },
}));
