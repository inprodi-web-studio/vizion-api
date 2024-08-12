const dayjs = require("dayjs");
const { ESTIMATE, ESTIMATE_STAGE, USER, CUSTOMER, LEAD, PRICE_LIST, PRODUCT } = require("../../../constants/models");
const { BadRequestError } = require("../../../helpers/errors");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const moment = require("moment-timezone");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService( ESTIMATE, ({ strapi }) => ({
    async addStats(estimates) {
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
            WHERE est_company.company_id = 1
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
            WHERE est_company.company_id = 1
                AND est_components.component_type = 'estimate.version'
                AND ver.is_active = 1
                AND ver_components.component_type = 'estimate.resume'
                AND est.created_at BETWEEN '${ startOfLastMonth }' AND '${ endOfLastMonth }'
        `);

        estimates.stats = {
            new : {
                current : estimatesThisMonth,
                passed  : estimatesLastMonth,
            },
            total : {
                current : totalThisMonthQuery[0][0].totalSum,
                passed  : totalLastMonthQuery[0][0].totalSum,
            },
            average : {
                current : totalThisMonthQuery[0][0].averageTicket,
                passed  : totalLastMonthQuery[0][0].averageTicket,
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

            const { id : productId } = await findOneByUuid( item.product, PRODUCT );
            data.items[i].product = productId;
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

    async updateConvertedEstimate(company, estimate, version) {
        const lastStage = await strapi.query( ESTIMATE_STAGE ).findOne({
            where : {
                company : company.id,
                potential : 100,
            },
        });

        await strapi.entityService.update( ESTIMATE, estimate.id, {
            data : {
                stage : lastStage.id,
                saleMeta : {
                    closingDate   : dayjs().format("YYYY-MM-DD"),
                    daysToClose   : dayjs().diff( dayjs( version.date, "day" )),
                    closedVersion : Number( version ),
                },
            },
        });
    },
}));
