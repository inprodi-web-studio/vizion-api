const { PACKAGE } = require('../../../constants/models');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(PACKAGE, ({ strapi }) => ({
    async validateParallelData( data ) {
        const { id : packageId } = await findOneByUuid( data.unity, PACKAGE );

        data.unity = packageId;
    },
}));
