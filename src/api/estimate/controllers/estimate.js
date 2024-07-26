const { ESTIMATE } = require('../../../constants/models');
const { validateCreate } = require('../content-types/estimate/estimate.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const estimateFields = {
    fields : ["uuid"],
    populate : {
        deliveryAddress : true,
    },
};

module.exports = createCoreController( ESTIMATE, ({ strapi }) => ({
    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await strapi.service( ESTIMATE ).validateParallelData( data );

        const fol = await strapi.service( ESTIMATE ).generateNextFol( company );

        const newEstimate = await strapi.entityService.create( ESTIMATE, {
            data : {
                fol,
                responsible : data.responsible,
                closingDate : data.closingDate,
                stage : data.stage,
                customer : data.customer,
                deliveryAddress : data.deliveryAddress,
                lead : data.lead,
                versions : [{
                    date : data.date,
                    dueDate : data.dueDate,
                    deliveryTime : data.deliveryTime,
                    paymentScheme : data.paymentScheme,
                    priceList : data.priceList,
                    subject : data.subject,
                    items : data.items,
                    resume : data.resume,
                    comments : data.comments,
                    terms : data.terms,
                }],
                company : company.id,
            },
            ...estimateFields
        });

        return newEstimate;
    },
}));
