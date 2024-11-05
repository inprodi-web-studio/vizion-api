const dayjs = require('dayjs');
const { PAYMENT, SALE, CREDIT_MOVEMENT } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(PAYMENT, ({ strapi }) => ({
    async validateParallellData(data) {
        const ctx = strapi.requestContext.get();
        const { uuid } = ctx.params; 

        const { id, payments, resume, paymentScheme, date, customer } = await findOneByUuid( uuid, SALE, {
            populate : {
                payments : true,
                resume   : true,
                customer : {
                    populate : {
                        credit : true,
                    },
                },
            },
        });

        const totalPaid = payments.reduce((acc, item) => acc + item.amount, 0);

        if ( totalPaid + data.amount > resume.total ) {
            throw new BadRequestError( "The amount paid can't be greater than the total", {
                key : "payment.greaterThanTotal",
                path : ctx.request.path,
            });
        }

        data.sale = id;

        const { status, daysDifference } = await strapi.service(PAYMENT).calculateStatus({ ...data, paymentScheme, payments, date, customer });

        data.status         = status;
        data.daysDifference = daysDifference;
    },

    async generateNextFol(company) {
        const lastFol = await strapi.query( PAYMENT ).findMany({
            where : {
                sale : {
                    company : company.id,
                },
            },
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

    async calculateStatus({ paymentScheme, payments, sale, date, customer }) {
        let status;
        let daysDifference;

        switch ( paymentScheme ) {
            case "anticipated":
                status         = "on-time";
                daysDifference = 0;
            break;

            case "on-deliver":
                // TODO: IMPLEMENTAR CUANDO SE TENGA LA LÓGICA DE ENTREGA O ESTADO DE ENTREGADO EN LA VENTA
            break;

            case "on-advance":
                if (payments.length === 0) {
                    status         = "on-time";
                    daysDifference = 0;
                }

                // TODO: LÓGICA IGUAL DE "ON DELIVER PARA LOS SIGIUENTES PAGOS QUE NO SEAN EL ANTICIPO"
            break;

            case "credit":
                const { policy, daysToPay } = await strapi.query(CREDIT_MOVEMENT).findOne({
                    where : {
                        sale,
                    },
                });

                if ( policy === "on-sale" ) {
                    const expectedDateToPay = dayjs( date ).add( daysToPay, "day" );
                    const difference = expectedDateToPay.diff( dayjs(), "day" );

                    daysDifference = difference;

                    if ( difference < 0 ) {
                        status = "delayed";
                    } else {
                        status = "on-time";
                    }
                }

                // TODO: IMPLEMENTAR LÓGICA CUANDO LA POLÍTICA ES POR FACTURA O POR ENTREGA
            break;
        }

        return {
            status,
            daysDifference,
        };
    },

    async handleCreditPayment(payment) {
        const ctx = strapi.requestContext.get();
        const method = ctx.request.method;

        if (method === "POST") {
            await strapi.entityService.create( CREDIT_MOVEMENT, {
                data : {
                    payment : payment.id,
                },
            });
        }

        if (method === "DELETE") {
            const creditMovement = await strapi.query(CREDIT_MOVEMENT).findOne({
                where : {
                    payment : payment.id,
                },
            });

            await strapi.entityService.delete( CREDIT_MOVEMENT, creditMovement.id );
        }

        await strapi.service(SALE).updateLineCreditUsage(payment.sale.customer.id, payment.sale.customer.credit);
    },
}));
