const { default: puppeteer } = require("puppeteer");
const { ESTIMATE, COMPANY, PREFERENCE, SALE, LEAD, ESTIMATE_STAGE } = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateCreate } = require("../content-types/estimate/estimate.validation");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");
const defaultEstimate = require("../../../templates/defaultEstimate.template");
const {validateKeyUpdate} = require("../../../helpers/validateKeyUpdate");
const dayjs = require("dayjs");

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
        saleMeta : true,
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
        lead : {
            fields : ["uuid", "finalName", "isActive"],
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
                    fields : ["quantity", "price", "iva", "realQuantity"],
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
                        package : {
                            fields : ["uuid", "conversionRate", "realConversion"],
                            populate : {
                                unity : true,
                            },
                        },
                        unity : {
                            fields : ["uuid", "name", "abbreviation"],
                        },
                        variation : {
                            fields : ["uuid", "sku"],
                            populate : {
                                values : {
                                    fields : ["uuid", "name"],
                                    populate : {
                                        attribute : {
                                            fields : ["uuid", "name"],
                                        },
                                    },
                                },
                            },
                        },
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
        sale : {
            fields : ["uuid", "fol", "subject"],
        },
    },
};

module.exports = createCoreController( ESTIMATE, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "fol",
                "customer.finalName",
                "lead.finalName",
                "versions.subject",
            ],
        };

        const estimates = await findMany( ESTIMATE, estimateFields, filters );

        return estimates;
    },

    async getStats() {
        return await strapi.service( ESTIMATE ).getStats();
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

        await strapi.service(ESTIMATE).setContactValue(data);

        if ( data.lead ) {
            await strapi.service(ESTIMATE).setLeadPotential(data);
        }

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

        await strapi.service(ESTIMATE).setContactValue(data);

        if ( data.lead ) {
            await strapi.service(ESTIMATE).setLeadPotential(data);
        }

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

        await strapi.service(ESTIMATE).setContactValue(data);

        if ( data.lead ) {
            await strapi.service(ESTIMATE).setLeadPotential(data);
        }

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

        await strapi.service(ESTIMATE).setContactValue({
            contactType : estimate.lead ? "lead" : "customer",
            lead : estimate.lead?.id,
            customer : estimate.customer?.id,
        });

        if ( estimate.lead ) {
            await strapi.service(ESTIMATE).setLeadPotential({
                lead : estimate.lead.id,
            });
        }

        return updatedEstimate;
    },

    async convert(ctx) {
        const { uuid, version } = ctx.params;
        const { company } = ctx.state;

        const estimate = await findOneByUuid( uuid, ESTIMATE, estimateFields );
        const selectedVersion = estimate.versions.find( v => v.fol === Number( version ) );

        if ( !selectedVersion.isActive ) {
            await strapi.service(ESTIMATE).removeActiveVersion(estimate.versions);
            await strapi.service(ESTIMATE).setActiveVersion(estimate.versions, version);
        }

        const preference = await strapi.service( PREFERENCE ).findOrCreate( company, "crm", "sales" );

        const fol = await strapi.service( SALE ).generateNextFol( company );

        let newCustomer;

        if ( estimate.lead ) {
            const lead = await strapi.service( LEAD ).prepareLeadData( estimate.lead?.uuid );

            newCustomer = await strapi.service( LEAD ).convertLeadToCustomer( lead, company );

            await strapi.entityService.delete( LEAD, estimate.lead.id );
        }

        const newSale = await strapi.entityService.create( SALE, {
            data : {
                fol,
                responsible : estimate.responsible,
                deliveryDate : selectedVersion.deliveryTime !== -1 ? dayjs().add( selectedVersion.deliveryTime, "day" ).format("YYYY-MM-DD") : null,
                customer : estimate.lead ? newCustomer.id : estimate.customer.id,
                deliveryAddress : estimate.deliveryAddress,
                date : dayjs().format("YYYY-MM-DD"),
                paymentScheme : selectedVersion.paymentScheme === "undefined" ? "anticipated" : selectedVersion.paymentScheme,
                priceList : selectedVersion.priceList.id,
                subject : selectedVersion.subject,
                items : selectedVersion.items,
                resume : selectedVersion.resume,
                comments : selectedVersion.comments,
                terms : selectedVersion.terms,
                company : company.id,
                creditPolicy : selectedVersion.paymentScheme === "credit" ? "on-sale" : null,
                limitPaymentDay : selectedVersion.paymentScheme === "credit" ? estimate.lead ? null : dayjs().add( estimate.customer.credit?.daysToPay, "day" ).format("YYYY-MM-DD") : null,
                isAuthorized : preference.config.needsAuthorization ? false : true,
                deliveryTime : selectedVersion.deliveryTime,
                estimate : estimate.id,
            },
            fields : ["uuid"],
        });

        await strapi.service( ESTIMATE ).updateConvertedEstimate( company, estimate, selectedVersion, estimate.versions );

        await strapi.service(ESTIMATE).setContactValue({
            contactType : "customer",
            customer : estimate.lead ? newCustomer.id : estimate.customer.id
        });

        return newSale;
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

        const {id, lead} = await findOneByUuid( uuid, ESTIMATE, estimateFields );

        const entityId = await strapi.service(ESTIMATE).keyFind( data );

        const updatedEstimate = await strapi.entityService.update( ESTIMATE, id, {
            data : {
                [data.key] : entityId,
            },
            ...estimateFields,
        });

        if (data.key === "stage" && lead) {
            await strapi.service(ESTIMATE).setLeadPotential({
                lead : lead.id,
            });
        }

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

        const { id, lead, customer } = await findOneByUuid( uuid, ESTIMATE, estimateFields );

        const deletedEstimate = await strapi.entityService.delete( ESTIMATE, id );

        await strapi.service(ESTIMATE).setContactValue({
            contactType : lead ? "lead" : "customer",
            lead : lead?.id,
            customer : customer?.id,
        });

        if (lead) {
            await strapi.service(ESTIMATE).setLeadPotential({
                lead : lead.id,
            });
        }

        return deletedEstimate;
    },
}));
