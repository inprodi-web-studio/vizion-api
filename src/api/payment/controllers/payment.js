const { PAYMENT, SALE } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/payment/payment.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const paymentFields = {
    fields : ["uuid", "date", "fol", "amount", "paymentMethod", "comments", "status", "daysDifference"],
    populate : {
        sale : {
            fields : ["uuid", "fol", "subject", "date"],
            populate : {
                customer : {
                    fields : ["uuid", "finalName", "isArchived"],
                    populate : {
                        credit : true,
                        mainAddress : true,
                        fiscalInfo : {
                            fields : ["legalName", "rfc", "regime"],
                            populate : {
                                address : true,
                            },
                        },
                        deliveryAddresses : {
                            fields : ["name", "isMain"],
                            populate : {
                                address : true,
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = createCoreController(PAYMENT, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "fol",
                "customer.finalName",
                "sale.subject"
            ],
        };

        const payments = await findMany( PAYMENT, paymentFields, filters, false );

        return payments;
    },

    async create(ctx) {
        const {company} = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await strapi.service(PAYMENT).validateParallellData( data );

        const fol = await strapi.service(PAYMENT).generateNextFol(company);

        const newPayment = await strapi.entityService.create(PAYMENT, {
            data : {
                fol,
                ...data,
            },
            ...paymentFields
        });

        await strapi.service(PAYMENT).handleCreditPayment(newPayment);

        return newPayment;
    },

    async update(ctx) {
        const data = ctx.request.body;
        const { uuid, paymentUuid } = ctx.params;

        await validateCreate( data );

        await findOneByUuid( uuid, SALE );
        const payment = await findOneByUuid( paymentUuid, PAYMENT, paymentFields );

        await strapi.service(PAYMENT).validateParallellData( data );

        const updatedPayment = await strapi.entityService.update( PAYMENT, payment.id, {
            data : {
                ...data,
            },
            ...paymentFields
        });

        await strapi.service(PAYMENT).handleCreditPayment(updatedPayment);

        return updatedPayment;
    },

    async delete(ctx) {
        const { uuid, paymentUuid } = ctx.params;

        await findOneByUuid( uuid, SALE );
        const payment = await findOneByUuid( paymentUuid, PAYMENT, paymentFields );

        await strapi.service(PAYMENT).handleCreditPayment(payment);

        const deletedPayment = await strapi.entityService.delete( PAYMENT, payment.id, paymentFields );

        return deletedPayment;
    },
}));