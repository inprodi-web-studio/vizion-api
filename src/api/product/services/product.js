const { PRODUCT, PRODUCT_CATEGORY, USER } = require("../../../constants/models");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService( PRODUCT, ({ strapi }) => ({
    async validateParallelData (data) {
        const ctx = strapi.requestContext.get();

        if ( data.category ) {
            const { id : categoryId } = await findOneByUuid( data.category, PRODUCT_CATEGORY );

            data.category = categoryId;
        }

        if ( data.stockInfo?.alertTo ) {
            const { id : alertToId } = await findOneByUuid( data.stockInfo.alertTo, USER );

            data.stockInfo.alertTo = alertToId;
        }
    },
}));
