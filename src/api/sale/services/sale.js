const { SALE, USER, CUSTOMER, PRICE_LIST, PRODUCT } = require("../../../constants/models");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const moment = require("moment-timezone");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(SALE, ({ strapi }) => ({
    async getStats() {
        const ctx = strapi.requestContext.get();
        const { company } = ctx.state;

        const timeZone         = "America/Mexico_City";
        const startOfMonth     = moment.tz( timeZone ).startOf("month").toISOString();
        const endOfMonth       = moment.tz(timeZone).endOf("month").toISOString();
        const startOfLastMonth = moment.tz(timeZone).subtract(1, "month").startOf("month").toISOString();
        const endOfLastMonth   = moment.tz(timeZone).subtract(1, "month").endOf("month").toISOString();

        const salesThisMonth = await strapi.query(SALE).count({
            where : {
                company  : company.id,
                isAuthorized : true,
                createdAt : {
                    $gte : startOfMonth,
                    $lte : endOfMonth,
                },
            },
        });

        const salesLastMonth = await strapi.query(SALE).count({
            where : {
                company  : company.id,
                isAuthorized : true,
                createdAt : {
                    $gte : startOfLastMonth,
                    $lte : endOfLastMonth,
                },
            },
        });

        return {
            new : {
                current : salesThisMonth,
                passed  : salesLastMonth,
            },
        };
    },

    async validateParallelData(data) {
        const { id : responsibleId } = await findOneByUuid( data.responsible, USER );
        data.responsible = responsibleId;

        const { id : customerId } = await findOneByUuid( data.customer, CUSTOMER );
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
            select : [],
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
