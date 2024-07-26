const { ESTIMATE, ESTIMATE_STAGE, USER, CUSTOMER, LEAD, PRICE_LIST, PRODUCT } = require("../../../constants/models");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService( ESTIMATE, ({ strapi }) => ({
    async validateParallelData(data) {
        const ctx = strapi.requestContext.get();

        const { id : responsibleId } = await findOneByUuid( data.responsible, USER );
        data.responsible = responsibleId;

        const { id : stageId } = await findOneByUuid( data.stage, ESTIMATE_STAGE );
        data.stage = stageId;

        if ( data.contactType === "customer" ) {
            const { id : customerId } = await findOneByUuid( data.contact, CUSTOMER );
            data.customer = customerId;
        }

        if ( data.contactType === "lead" ) {
            const { id : leadId } = await findOneByUuid( data.contact, LEAD );
            data.lead = leadId;
        }

        const { id : priceListId } = await findOneByUuid( data.priceList, PRICE_LIST );
        data.priceList = priceListId;

        for ( let i = 0; i < data.items.length; i++ ) {
            const item = data.items[i];

            const { id : productId } = await findOneByUuid( item.product, PRODUCT );
            data.items[i].product = productId;
        }
    },

    async generateNextFol( company ) {
        const lastFol = await strapi.query( ESTIMATE ).findMany({
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
