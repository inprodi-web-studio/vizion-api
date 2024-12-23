const { default: puppeteer } = require('puppeteer');
const { PAYMENT, SALE, COMPANY, PREFERENCE } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/payment/payment.validation');
const defaultPayment = require('../../../templates/defaultPayment.template');

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

    async generatePdf(ctx) {
        const { uuid, paymentUuid } = ctx.params;
        const { company } = ctx.state;

        await findOneByUuid( uuid, SALE );

        const payment = await findOneByUuid( paymentUuid, PAYMENT, paymentFields );

        try {
            const browser = await puppeteer.launch({
                executablePath : process.env.PUPPETEER_EXECUTABLE_PATH,
                args : [
                    "--disable-gpu",
                    "--disable-setuid-sandbox",
                    "--no-sandbox",
                    "--no-zygote",
                ],
                ignoreDefaultArgs: ["--disable-extensions"],
            });

            const page = await browser.newPage();

            const companyInfo = await strapi.entityService.findOne( COMPANY, company.id, {
                fields : ["name", "website"],
                populate : {
                    logotype : {
                        fields : ["url", "name"],
                    },
                    fiscalInfo : {
                        fields : ["legalName", "rfc", "regime"],
                        populate : {
                            address : true,
                        },
                    },
                    address : true,
                },
            });

            const { config } = await strapi.query(PREFERENCE).findOne({
                where : {
                    company : company.id,
                    app : "crm",
                    module : "estimates",
                },
            });

            const template = defaultPayment( payment, config, companyInfo );

            await page.setContent( template );

            const pdfBuffer = await page.pdf({
                format : "A4",
                printBackground : true,
                margin : {
                    top : 30,
                    right : 30,
                    bottom : 30,
                    left : 30
                }
            });

            await browser.close();

            ctx.response.type = "application/pdf";
            ctx.response.attachment("tester.pdf");
            ctx.response.length = "pdfBuffer.length";

            ctx.body = pdfBuffer;
        } catch (error) {
            console.error(error);

            throw new BadRequestError("Error while generating pdf", {
                key : "payment.pdfGeneration",
                path : ctx.request.path,
            });
        }
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