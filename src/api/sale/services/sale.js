const { SALE, USER, CUSTOMER, PRICE_LIST, PRODUCT } = require("../../../constants/models");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(SALE, ({ strapi }) => ({
    async validateParallelData(data) {
        const { id : responsibleId } = await findOneByUuid( data.responsible, USER );
        data.responsible = responsibleId;

        const { id : customerId } = await findOneByUuid( data.contact, CUSTOMER );
        data.customer = customerId;

        const { id : priceListId } = await findOneByUuid( data.priceList, PRICE_LIST );
        data.priceList = priceListId;

        for ( let i = 0; i < data.items.length; i++ ) {
            const item = data.items[i];

            const { id : productId } = await findOneByUuid( item.product, PRODUCT );
            data.items[i].product = productId;
        }

        if ( data.deliveryAddress ) {
            delete data.deliveryAddress.id;
            delete data.deliveryAddress.address.id;
        }
    },

    async generateNextFol( company ) {
        const lastFol = await strapi.query( SALE ).findMany({
            where : {
                company : company.id,
            },
            select : [ "closingDate" ],
            orderBy : {
                fol : "desc",
            },
            limit : 1,
        });

        if ( lastFol.length === 0 ) {
            return 1;
        }

        return lastFol[0].fol + 1;
    },
}));
