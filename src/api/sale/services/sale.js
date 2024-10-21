const { SALE, USER, CUSTOMER, PRICE_LIST, PRODUCT, ESTIMATE } = require("../../../constants/models");
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

        const totalThisMonthQuery = await strapi.db.connection.raw(`
            SELECT
                SUM(res.total) AS totalSum,
                AVG(res.total) AS averageTicket
            FROM sales as sale
            JOIN sales_company_links as sale_company ON sale.id = sale_company.sale_id
            JOIN sales_components as sale_components ON sale.id = sale_components.entity_id
            JOIN components_estimate_resumes AS res ON sale_components.component_id = res.id
            WHERE sale_company.company_id = ${company.id}
                AND sale_components.component_type = 'estimate.resume'
                AND sale.is_authorized = 1
                AND sale.created_at BETWEEN '${startOfMonth}' AND '${endOfMonth}'
        `);

        const totalLastMonthQuery = await strapi.db.connection.raw(`
            SELECT
                SUM(res.total) AS totalSum,
                AVG(res.total) AS averageTicket
            FROM sales as sale
            JOIN sales_company_links as sale_company ON sale.id = sale_company.sale_id
            JOIN sales_components as sale_components ON sale.id = sale_components.entity_id
            JOIN components_estimate_resumes AS res ON sale_components.component_id = res.id
            WHERE sale_company.company_id = ${company.id}
                AND sale_components.component_type = 'estimate.resume'
                AND sale.is_authorized = 1
                AND sale.created_at BETWEEN '${startOfLastMonth}' AND '${endOfLastMonth}'
        `);

        return {
            new : {
                current : salesThisMonth,
                passed  : salesLastMonth,
            },
            total : {
                current : totalThisMonthQuery[0][0].totalSum ?? 0,
                passed  : totalLastMonthQuery[0][0].totalSum ?? 0,
            },
            average : {
                current : totalThisMonthQuery[0][0].averageTicket ?? 0,
                passed  : totalLastMonthQuery[0][0].averageTicket ?? 0,
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

    async updateCustomerMeta({ customer, date }) {
        const { id, customerMeta } = await strapi.entityService.findOne( CUSTOMER, customer.id, {
            populate : {
                customerMeta : true,
            },    
        });

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
            WHERE sale_customer.customer_id = ${id}
                AND sale.is_authorized = true
                AND sale_components.component_type = 'estimate.resume'
        `);

        const estimatesTotal = totalEstimates[0][0]?.totalSum ?? 0;
        const taxesTotal = totalEstimates[0][0]?.taxesSum ?? 0;
        const estimates = estimatesTotal - taxesTotal;

        const salesTotal = totalSales[0][0]?.totalSum ?? 0;
        const salesTaxesTotal = totalSales[0][0]?.taxesSum ?? 0;
        const sales = salesTotal - salesTaxesTotal;

        await strapi.entityService.update( CUSTOMER, id, {
            data : {
                value : estimates + sales,
                customerMeta : {
                    ...customerMeta,
                    lastSale : date,
                    totalSales : sales,
                },
            } 
        });
    },

    async updateEstimateMetaInfo( saleId ) {
        const estimate = await strapi.query( ESTIMATE ).findOne({
            where : {
                sale : saleId,
            },
        });

        if (!estimate) {
            return;
        }

        await strapi.entityService.update( ESTIMATE, estimate.id, {
            data : {
                saleMeta : null,
            },
        });
    },
}));
