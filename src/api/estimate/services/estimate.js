const dayjs = require("dayjs");
const { ESTIMATE, ESTIMATE_STAGE, USER, CUSTOMER, LEAD, PRICE_LIST, PRODUCT, PACKAGE, PRODUCT_VARIATION } = require("../../../constants/models");
const { BadRequestError } = require("../../../helpers/errors");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const moment = require("moment-timezone");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService( ESTIMATE, ({ strapi }) => ({
    async getStats() {
        const ctx = strapi.requestContext.get();
        const { company } = ctx.state;

        const timeZone         = "America/Mexico_City";
        const startOfMonth     = moment.tz( timeZone ).startOf("month").toISOString();
        const endOfMonth       = moment.tz(timeZone).endOf("month").toISOString();
        const startOfLastMonth = moment.tz(timeZone).subtract(1, "month").startOf("month").toISOString();
        const endOfLastMonth   = moment.tz(timeZone).subtract(1, "month").endOf("month").toISOString();

        const estimatesThisMonth = await strapi.query(ESTIMATE).count({
            where : {
                company  : company.id,
                createdAt : {
                    $gte : startOfMonth,
                    $lte : endOfMonth,
                },
            },
        });

        const estimatesLastMonth = await strapi.query(ESTIMATE).count({
            where : {
                company  : company.id,
                createdAt : {
                    $gte : startOfLastMonth,
                    $lte : endOfLastMonth,
                },
            },
        });
        
        const totalThisMonthQuery = await strapi.db.connection.raw(`
            SELECT
                SUM(res.total) AS totalSum,
                AVG(res.total) AS averageTicket
            FROM estimates as est
            JOIN estimates_company_links as est_company ON est.id = est_company.estimate_id
            JOIN estimates_components as est_components ON est.id = est_components.entity_id
            JOIN components_estimate_versions AS ver ON est_components.component_id = ver.id
            JOIN components_estimate_versions_components AS ver_components ON ver.id = ver_components.entity_id
            JOIN components_estimate_resumes AS res ON ver_components.component_id = res.id
            WHERE est_company.company_id = ${ company.id }
                AND est_components.component_type = 'estimate.version'
                AND ver.is_active = 1
                AND ver_components.component_type = 'estimate.resume'
                AND est.created_at BETWEEN '${ startOfMonth }' AND '${ endOfMonth }'
        `);

        const totalLastMonthQuery = await strapi.db.connection.raw(`
            SELECT
                SUM(res.total) AS totalSum,
                AVG(res.total) AS averageTicket
            FROM estimates as est
            JOIN estimates_company_links as est_company ON est.id = est_company.estimate_id
            JOIN estimates_components as est_components ON est.id = est_components.entity_id
            JOIN components_estimate_versions AS ver ON est_components.component_id = ver.id
            JOIN components_estimate_versions_components AS ver_components ON ver.id = ver_components.entity_id
            JOIN components_estimate_resumes AS res ON ver_components.component_id = res.id
            WHERE est_company.company_id = ${ company.id }
                AND est_components.component_type = 'estimate.version'
                AND ver.is_active = 1
                AND ver_components.component_type = 'estimate.resume'
                AND est.created_at BETWEEN '${ startOfLastMonth }' AND '${ endOfLastMonth }'
        `);
        

        const totalClosedThisMonthQuery = await strapi.db.connection.raw(`
            SELECT
                SUM(meta.closed_total) AS totalSum
            FROM estimates as est
            JOIN estimates_company_links as est_company ON est.id = est_company.estimate_id
            JOIN estimates_components as est_components ON est.id = est_components.entity_id
            JOIN components_estimate_sales_metas as meta ON est_components.component_id = meta.id
            WHERE est_company.company_id = ${ company.id }
                AND est_components.component_type = 'estimate.sales-meta'
                AND meta.closing_date BETWEEN '${ startOfMonth.split("T")[0] }' AND '${ endOfMonth.split("T")[0] }'
        `);

        const totalClosedLastMonthQuery = await strapi.db.connection.raw(`
            SELECT
                SUM(meta.closed_total) AS totalSum
            FROM estimates as est
            JOIN estimates_company_links as est_company ON est.id = est_company.estimate_id
            JOIN estimates_components as est_components ON est.id = est_components.entity_id
            JOIN components_estimate_sales_metas as meta ON est_components.component_id = meta.id
            WHERE est_company.company_id = ${ company.id }
                AND est_components.component_type = 'estimate.sales-meta'
                AND meta.closing_date BETWEEN '${ startOfLastMonth.split("T")[0] }' AND '${ endOfLastMonth.split("T")[0] }'
        `);

        return {
            new : {
                current : estimatesThisMonth ?? 0,
                passed  : estimatesLastMonth ?? 0,
            },
            total : {
                current : totalThisMonthQuery[0][0].totalSum ?? 0,
                passed  : totalLastMonthQuery[0][0].totalSum ?? 0,
            },
            average : {
                current : totalThisMonthQuery[0][0].averageTicket ?? 0,
                passed  : totalLastMonthQuery[0][0].averageTicket ?? 0,
            },
            closed : {
                current : totalClosedThisMonthQuery[0][0].totalSum ?? 0,
                passed  : totalClosedLastMonthQuery[0][0].totalSum ?? 0,
            },
        };
    },

    async validateParallelData(data) {
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

            const { id : productId, unity } = await findOneByUuid( item.product, PRODUCT, {
                populate : {
                    unity : {
                        fields : ["id"],
                    },
                },
            });

            data.items[i].product = productId;

            if (item.package) {
                const { id : packageId } = await findOneByUuid( item.package, PACKAGE );
                data.items[i].package = packageId;
            }

            if (item.variation) {
                const { id : variationId } = await findOneByUuid( item.variation, PRODUCT_VARIATION );
                data.items[i].variation = variationId;
            }

            data.unity = unity.id;
        }

        if ( data.deliveryAddress ) {
            delete data.deliveryAddress.id;
            delete data.deliveryAddress.address.id;
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

    async setContactValue({contactType, lead, customer}) {
        if (contactType === "customer") {
            const totalEstimates = await strapi.db.connection.raw(`
                SELECT
                    SUM(res.total) AS totalSum,
                    SUM(res.taxes) AS taxesSum
                FROM estimates as est
                JOIN estimates_customer_links as est_customer ON est.id = est_customer.estimate_id
                JOIN estimates_components as est_components ON est.id = est_components.entity_id
                JOIN components_estimate_versions AS ver ON est_components.component_id = ver.id
                JOIN components_estimate_versions_components AS ver_components ON ver.id = ver_components.entity_id
                JOIN components_estimate_resumes AS res ON ver_components.component_id = res.id
                LEFT JOIN estimates_sale_links as est_sale ON est.id = est_sale.estimate_id
                WHERE est_customer.customer_id = ${customer}
                    AND est_components.component_type = 'estimate.version'
                    AND ver.is_active = 1
                    AND ver_components.component_type = 'estimate.resume'
                    AND est_sale.sale_id IS NULL
            `);

            const totalSales = await strapi.db.connection.raw(`
                SELECT
                    SUM(res.total) AS totalSum,
                    SUM(res.taxes) AS taxesSum
                FROM sales as sale
                JOIN sales_customer_links as sale_customer ON sale.id = sale_customer.sale_id
                JOIN sales_components as sale_components ON sale.id = sale_components.entity_id
                JOIN components_estimate_resumes AS res ON sale_components.component_id = res.id
                WHERE sale_customer.customer_id = ${customer}
                    AND sale.is_authorized = true
                    AND sale_components.component_type = 'estimate.resume'
            `);

            const estimatesTotal = totalEstimates[0][0]?.totalSum ?? 0;
            const taxesTotal = totalEstimates[0][0]?.taxesSum ?? 0;
            const estimates = estimatesTotal - taxesTotal;

            const salesTotal = totalSales[0][0]?.totalSum ?? 0;
            const salesTaxesTotal = totalSales[0][0]?.taxesSum ?? 0;
            const sales = salesTotal - salesTaxesTotal;

            await strapi.entityService.update( contactType === "lead" ? LEAD : CUSTOMER, contactType === "lead" ? lead : customer, {
                data : {
                    value : estimates + sales,
                }
            });
        }

        if (contactType === "lead") {
            const totalValue = await strapi.db.connection.raw(`
                SELECT
                    SUM(res.total) AS totalSum,
                    SUM(res.taxes) AS taxesSum
                FROM estimates as est
                JOIN estimates_lead_links as est_lead ON est.id = est_lead.estimate_id
                JOIN estimates_components as est_components ON est.id = est_components.entity_id
                JOIN components_estimate_versions AS ver ON est_components.component_id = ver.id
                JOIN components_estimate_versions_components AS ver_components ON ver.id = ver_components.entity_id
                JOIN components_estimate_resumes AS res ON ver_components.component_id = res.id
                WHERE est_lead.lead_id = ${ lead }
                    AND est_components.component_type = 'estimate.version'
                    AND ver.is_active = 1
                    AND ver_components.component_type = 'estimate.resume'
            `);

            const estimatesTotal = totalValue[0][0]?.totalSum ?? 0;
            const taxesTotal = totalValue[0][0]?.taxesSum ?? 0;

            await strapi.entityService.update( contactType === "lead" ? LEAD : CUSTOMER, contactType === "lead" ? lead : customer, {
                data : {
                    value : estimatesTotal - taxesTotal,
                }
            });
        }
    },

    async setLeadPotential({lead}) {
        const potential = await strapi.db.connection.raw(`
            SELECT
                SUM( stage.potential * res.total ) / SUM( res.total ) AS potential
            FROM estimates as est
            JOIN estimates_lead_links as est_lead ON est.id = est_lead.estimate_id
            JOIN estimates_stage_links as est_stage ON est.id = est_stage.estimate_id
            JOIN estimate_stages as stage ON est_stage.estimate_stage_id = stage.id
            JOIN estimates_components as est_components ON est.id = est_components.entity_id
            JOIN components_estimate_versions AS ver ON est_components.component_id = ver.id
            JOIN components_estimate_versions_components AS ver_components ON ver.id = ver_components.entity_id
            JOIN components_estimate_resumes AS res ON ver_components.component_id = res.id
            WHERE est_lead.lead_id = ${ lead }
                AND est_components.component_type = 'estimate.version'
                AND ver.is_active = 1
                AND ver_components.component_type = 'estimate.resume'
        `);

        await strapi.entityService.update( LEAD, lead, {
            data : {
                potential : potential[0][0].potential ?? 0,
            }
        });
    },

    async generateNextVersionFol(versions) {
        const maxFol = versions.reduce((max, obj) => {
            return obj.fol > max ? obj.fol : max;
        }, 0);

        return maxFol + 1;
    },

    async removeActiveVersion(versions) {
        const index = versions.findIndex( v => v.isActive );
        versions[index].isActive = false;
    },

    async setActiveVersion(versions, activeFol) {
        const index = versions.findIndex( v => v.fol === Number(activeFol) );
        versions[index].isActive = true;
    },

    async removeVersion(versions, fol) {
        const index = versions.findIndex( v => v.fol === Number(fol) );
        versions.splice(index, 1);
    },

    async keyFind({ key, value }) {
        const ctx = strapi.requestContext.get();

        let entityId;

        switch ( key ) {
            case "responsible":
                const { id : responsibleId } = await findOneByUuid( value, USER );
                entityId = responsibleId;
            break;

            case "stage":
                const { id : stageId } = await findOneByUuid( value, ESTIMATE_STAGE );
                entityId = stageId;
            break;

            default:
                throw new BadRequestError( `The key ${key} is not supported in key update`, {
                    key  : "estimate.unkownKey",
                    path : ctx.request.url,
                });
        }

        return entityId;
    },

    async updateConvertedEstimate(company, estimate, version, versions) {
        const lastStage = await strapi.query( ESTIMATE_STAGE ).findOne({
            where : {
                company : company.id,
                potential : 100,
            },
        });

        await strapi.entityService.update( ESTIMATE, estimate.id, {
            data : {
                versions,
                stage : lastStage.id,
                saleMeta : {
                    closingDate   : dayjs().format("YYYY-MM-DD"),
                    daysToClose   : dayjs().diff( dayjs( version.date ), "day"),
                    closedVersion : Number( version.fol ),
                    closedTotal   : version.resume.total,
                },
            },
        });
    },
}));
