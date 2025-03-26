const dayjs = require("dayjs");
const { SALE, USER, CUSTOMER, PRICE_LIST, PRODUCT, ESTIMATE, CREDIT_MOVEMENT, STOCK_DISPATCH, PACKAGE, PRODUCT_VARIATION } = require("../../../constants/models");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const moment = require("moment-timezone");
const product = require("../../product/controllers/product");

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

        const active = await strapi.query( SALE ).count({
            where : {
                isCancelled : false,
                isAuthorized : true,
                company  : company.id,
            },
        });

        const cancelled = await strapi.query( SALE ).count({
            where : {
                isCancelled : true,
                company  : company.id,
            },
        });

        const pending = await strapi.query( SALE ).count({
            where : {
                isCancelled : false,
                isAuthorized : false,
                company  : company.id,
            }
        });

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

        const totalSalesAmount = await strapi.db.connection.raw(`
            SELECT
                SUM(res.total) AS totalSum
            FROM sales as sale
            JOIN sales_company_links as sale_company ON sale.id = sale_company.sale_id
            JOIN sales_components as sale_components ON sale.id = sale_components.entity_id
            JOIN components_estimate_resumes AS res ON sale_components.component_id = res.id
            WHERE sale_company.company_id = ${company.id}
                AND sale_components.component_type = 'estimate.resume'
                AND sale.is_authorized = 1
        `);

        const totalPaymentsAmount = await strapi.db.connection.raw(`
            SELECT
                SUM(payment.amount) AS totalSum
            FROM payments as payment
            JOIN payments_sale_links as payment_sale ON payment.id = payment_sale.payment_id
            JOIN sales as sale ON sale.id = payment_sale.sale_id
            JOIN sales_company_links as sale_company ON sale.id = sale_company.sale_id
            WHERE sale_company.company_id = ${company.id}
                AND sale.is_authorized = 1
        `);

        const totalSell = totalSalesAmount[0][0].totalSum ?? 0;
        const totalPaid = totalPaymentsAmount[0][0].totalSum ?? 0;

        return {
            active,
            cancelled,
            pending,
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
            receivable : totalSell - totalPaid,
        };
    },

    async validateParallelData(data) {
        const { id : responsibleId } = await findOneByUuid( data.responsible, USER );
        data.responsible = responsibleId;

        const { id : customerId, credit } = await findOneByUuid( data.customer, CUSTOMER, {
            populate : {
                credit : true,
            },
        });

        data.customer = customerId;
        data.customerCredit = credit;

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
                const { id : packageId, realConversion } = await findOneByUuid( item.package, PACKAGE );
                data.items[i].package = packageId;
                data.items[i].realQuantity = realConversion * item.quantity;
            }

            if (item.variation) {
                const { id : variationId } = await findOneByUuid( item.variation, PRODUCT_VARIATION );
                data.items[i].variation = variationId;
            }

            data.items[i].unity = unity.id;
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
        const { id, customerMeta } = await strapi.entityService.findOne( CUSTOMER, customer, {
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
            WHERE est_customer.customer_id = ${id}
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

        let lastSale;

        if (!date) {
            lastSale = await strapi.query( SALE ).findOne({
                where : {
                    customer : id,
                },
                sort : "date:desc",
            });
        }

        await strapi.entityService.update( CUSTOMER, id, {
            data : {
                value : estimates + sales,
                customerMeta : {
                    ...customerMeta,
                    lastSale : date ? date : lastSale?.date ? lastSale.date : null,
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

    async handleCreditSale({customerCredit, customer, paymentScheme}, sale) {
        const ctx = strapi.requestContext.get();
        const method = ctx.request.method;

        if (paymentScheme !== "credit") {
            return;
        }

        const { policy, daysToPay } = customerCredit;

        if (method === "POST" || method === "PATCH") {
            await strapi.entityService.create( CREDIT_MOVEMENT, {
                data : {
                    sale : sale.id,
                    policy,
                    daysToPay,
                },
            });
        }

        if (method === "PUT") {
            const creditMovement = await strapi.query( CREDIT_MOVEMENT ).findOne({
                where : {
                    sale : sale.id,
                },
            });

            await strapi.entityService.update( CREDIT_MOVEMENT, creditMovement.id, {
                data : {
                    policy,
                    daysToPay,
                },
            });
        }

        await strapi.service(SALE).updateLineCreditUsage(customer, customerCredit);
    },

    async updateLineCreditUsage(customerId, customerCredit) {
        const used = await strapi.db.connection.raw(`
            SELECT
                SUM(cer.total) AS total_used
            FROM
                credit_movements cm
                INNER JOIN credit_movements_sale_links cml ON cm.id = cml.credit_movement_id
                INNER JOIN sales s ON s.id = cml.sale_id
                INNER JOIN sales_customer_links scl ON scl.sale_id = s.id
                INNER JOIN sales_components sc ON sc.entity_id = s.id
                    AND sc.component_type = 'estimate.resume'
                INNER JOIN components_estimate_resumes cer ON cer.id = sc.component_id
            WHERE
                scl.customer_id = ${customerId}
                AND s.is_authorized = true;
        `);

        const paid = await strapi.db.connection.raw(`
            SELECT
                SUM(p.amount) AS total_paid
            FROM
                credit_movements cm
                INNER JOIN credit_movements_payment_links cml ON cm.id = cml.credit_movement_id
                INNER JOIN payments p ON p.id = cml.payment_id
                INNER JOIN payments_sale_links psl ON psl.payment_id = p.id
                INNER JOIN sales s ON s.id = psl.sale_id
                INNER JOIN sales_customer_links scl ON scl.sale_id = s.id
            WHERE
                scl.customer_id = ${customerId}
        `);

        const totalUsed = used[0][0]?.total_used ?? 0;
        const totalPaid = paid[0][0]?.total_paid ?? 0;

        const balance = totalUsed - totalPaid;

        await strapi.entityService.update( CUSTOMER, customerId, {
            data : {
                credit : {
                    ...customerCredit,
                    amountUsed : balance,
                }
            }
        });
    },

    async deleteParallelData( saleId ) {
        const creditMovements = await strapi.query( CREDIT_MOVEMENT ).findMany({
            where : {
                $or : [
                    {
                        sale : saleId,
                    },
                    {
                        payment : {
                            sale : saleId,
                        },
                    },
                ],
            },
        });

        for (const creditMovement of creditMovements) {
            await strapi.entityService.delete( CREDIT_MOVEMENT, creditMovement.id );
        }

        // TODO: delete payments
    },
}));
