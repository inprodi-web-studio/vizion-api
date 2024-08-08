const { default: puppeteer } = require("puppeteer");
const { ESTIMATE, COMPANY, PREFERENCE } = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateCreate } = require("../content-types/estimate/estimate.validation");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");
const defaultEstimate = require("../../../templates/defaultEstimate.template");
const {validateKeyUpdate} = require("../../../helpers/validateKeyUpdate");

const { createCoreController } = require("@strapi/strapi").factories;

const estimateFields = {
    fields : ["uuid", "fol", "closingDate"],
    populate : {
        responsible : {
            fields : ["uuid", "name", "middleName", "lastName"],
            populate : {
                image : {
                    fields : ["url"],
                },
            },
        },
        stage : {
            fields : ["uuid", "name"],
        },
        customer : {
            fields : ["uuid", "finalName"],
            populate : {
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
        lead : {
            fields : ["uuid", "finalName"],
            populate : {
                mainAddress : true,
                deliveryAddresses : {
                    fields : ["name", "isMain"],
                    populate : {
                        address : true,
                    },
                },
            },
        },
        deliveryAddress : {
            fields : ["name", "isMain"],
            populate : {
                address : true,
            },
        },
        versions : {
            fields : ["fol", "isActive", "date", "dueDate", "subject", "deliveryTime", "paymentScheme", "comments", "terms"],
            populate : {
                priceList : {
                    fields : ["uuid", "name"],
                },
                items : {
                    fields : ["quantity", "price", "iva"],
                    populate : {
                        product : {
                            fields : ["uuid", "name", "sku", "description"],
                            populate : {
                                images : {
                                    fields : ["url"],
                                },
                            },
                        },
                        discount : true,
                    },
                },
                resume : {
                    fields : ["subtotal", "individualDiscounts", "taxes", "shipping", "total"],
                    populate : {
                        globalDiscount : true,
                    },
                },
            },
        },
    },
};

module.exports = createCoreController( ESTIMATE, ({ strapi }) => ({
    async find(ctx) {
        const query = ctx.query;

        const filters = {
            $search : [
                "fol",
                "customer.finalName",
                "lead.finalName",
                "versions.subject",
            ],
        };

        const estimates = await findMany( ESTIMATE, estimateFields, filters );

        if ( query?.stats ) {
            await strapi.service( ESTIMATE ).addStats( estimates );
        }

        return estimates;
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;

        const estimate = await findOneByUuid( uuid, ESTIMATE, estimateFields );

        return estimate;
    },

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
                deliveryAddress : data.deliveryAddress ? data.deliveryAddress : null,
                lead : data.lead,
                versions : [{
                    fol : 1,
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
                    isActive : true,
                }],
                company : company.id,
            },
            ...estimateFields
        });

        return newEstimate;
    },

    async update(ctx) {
        const { uuid, version } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const estimate = await findOneByUuid( uuid, ESTIMATE, estimateFields );

        await strapi.service( ESTIMATE ).validateParallelData( data );

        const versions = estimate.versions;
        const index = versions.findIndex( v => v.fol === Number( version ) );

        versions[index] = {
            ...versions[index],
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
        };

        const updatedEstimate = await strapi.entityService.update( ESTIMATE, estimate.id, {
            data : {
                deliveryAddress : data.deliveryAddress ? data.deliveryAddress : null,
                versions,
            },
            ...estimateFields
        });

        return updatedEstimate;
    },

    async newVersion(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const estimate = await findOneByUuid( uuid, ESTIMATE, estimateFields );

        await strapi.service( ESTIMATE ).validateParallelData( data );

        const versions = estimate.versions;

        const versionFol = await strapi.service( ESTIMATE ).generateNextVersionFol( versions );

        await strapi.service(ESTIMATE).removeActiveVersion(versions);

        const updatedEstimate = await strapi.entityService.update( ESTIMATE, estimate.id, {
            data : {
                versions : [
                    ...versions,
                    {
                        fol : versionFol,
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
                        isActive : true,
                    }
                ],
            },
            ...estimateFields
        });

        return {
            newFol   : versionFol,
            estimate : updatedEstimate
        };
    },

    async setActiveVersion(ctx) {
        const { uuid, version } = ctx.params;

        const estimate = await findOneByUuid( uuid, ESTIMATE, estimateFields );

        const versions = estimate.versions;

        await strapi.service(ESTIMATE).removeActiveVersion(versions);

        await strapi.service(ESTIMATE).setActiveVersion(versions, version);

        const updatedEstimate = await strapi.entityService.update( ESTIMATE, estimate.id, {
            data : {
                versions,
            },
            ...estimateFields
        });

        return updatedEstimate;
    },

    async removeVersion(ctx) {
        const { uuid, version } = ctx.params;

        const estimate = await findOneByUuid( uuid, ESTIMATE, estimateFields );

        const versions = estimate.versions;

        await strapi.service(ESTIMATE).removeVersion(versions, version);

        const updatedEstimate = await strapi.entityService.update( ESTIMATE, estimate.id, {
            data : {
                versions,
            },
            ...estimateFields
        });

        return updatedEstimate;
    },

    async keyUpdate(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        await validateKeyUpdate( data );

        const {id} = await findOneByUuid( uuid, ESTIMATE, estimateFields );

        const entityId = await strapi.service(ESTIMATE).keyFind( data );

        const updatedEstimate = await strapi.entityService.update( ESTIMATE, id, {
            data : {
                [data.key] : entityId,
            },
            ...estimateFields,
        });

        return updatedEstimate;
    },

    async generatePdf(ctx) {
        const { uuid, version } = ctx.params;
        const { company } = ctx.state;

        const estimate = await findOneByUuid( uuid, ESTIMATE, estimateFields );

        const versionItem = estimate.versions.find( v => v.fol === Number( version ) );

        if ( !versionItem ) {
            throw new NotFoundError( "Estimate version not found", {
                key : "estimate.versionNotFound",
                path : ctx.request.path,
            });
        }

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

            const template = defaultEstimate(estimate, versionItem, config, companyInfo);

            await page.setContent(template);
    
            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin : {
                    top: 30,
                    right: 40,
                    bottom: 30,
                    left: 40,
                },
            });
    
            await browser.close();

            ctx.response.type = "application/pdf";
            ctx.response.attachment("tester.pdf");
            ctx.response.length = "pdfBuffer.length";

            ctx.body = pdfBuffer;
        } catch (error) {
            console.error(error);

            throw new BadRequestError("Error while generating pdf", {
                key : "estimate.pdfGeneration",
                path : ctx.request.url,
            });
        }
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, ESTIMATE );

        const deletedEstimate = await strapi.entityService.delete( ESTIMATE, id );

        return deletedEstimate;
    },
}));
