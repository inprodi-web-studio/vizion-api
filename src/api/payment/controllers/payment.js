const { PAYMENT } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const { validateCreate } = require('../content-types/payment/payment.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const paymentFields = {
    fields : ["uuid", "date", "fol", "amount", "paymentMethod", "comments", "status", "daysDifference"],
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
        sale : {
            fields : ["uuid", "fol", "subject", "date"],
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
        });

        return newPayment;
    },

    async update() {},

    async delete() {},
}));