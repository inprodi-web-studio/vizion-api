const dayjs = require("dayjs");
const {
    TAG,
    LEAD,
    USER,
    CONTACT_GROUP,
    CONTACT_SOURCE,
    CONTACT_INTERACTION,
    CUSTOMER,
    ESTIMATE,
    TASK,
    NOTE,
    INSIDER,
} = require("../../../constants/models");

const { BadRequestError } = require("../../../helpers/errors");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const moment = require("moment-timezone");
const { default: axios } = require("axios");

const leadFields = {
    fields: ["uuid", "tradeName", "finalName", "email", "website", "rating", "isActive", "value", "potential", "createdAt"],
    populate: {
        completeName: true,
        phone: true,
        cellphone: true,
        mainAddress: true,
        fiscalInfo: true,
        group: true,
        source: true,
        tags: true,
        insiders: {
            fields: ["uuid", "email", "isPrimary", "job"],
            populate: {
                completeName: true,
                phone: true,
            },
        },
        responsible: {
            fields: ["uuid", "name", "middleName", "lastName"],
            populate: {
                image: {
                    fields: ["url"],
                },
            },
        },
        deliveryAddresses: {
            fields: ["name", "references", "isMain"],
            populate: {
                address: true,
            },
        },
        createdByUser : {
            fields : ["uuid", "name", "middleName", "lastName"],
            populate : {
                image : {
                    fields : ["url"],
                },
            },
        }
    },
};

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(LEAD, ({ strapi }) => ({
    async getStats() {
        const ctx = strapi.requestContext.get();
        const { company } = ctx.state;

        const active = await strapi.query(LEAD).count({
            where: {
                isActive: true,
                company: company.id,
            },
        });

        const inactive = await strapi.query(LEAD).count({
            where: {
                isActive: false,
                company: company.id,
            },
        });

        const timeZone = "America/Mexico_City";
        const startOfMonth = moment.tz(timeZone).startOf("month").toISOString();
        const endOfMonth = moment.tz(timeZone).endOf("month").toISOString();
        const startOfLastMonth = moment.tz(timeZone).subtract(1, "month").startOf("month").toISOString();
        const endOfLastMonth = moment.tz(timeZone).subtract(1, "month").endOf("month").toISOString();

        const leadsThisMonth = await strapi.query(LEAD).count({
            where: {
                company: company.id,
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth,
                },
            },
        });

        const leadsLastMonth = await strapi.query(LEAD).count({
            where: {
                company: company.id,
                createdAt: {
                    $gte: startOfLastMonth,
                    $lte: endOfLastMonth,
                },
            },
        });

        const convertedButCreatedThisMonth = await strapi.query(CUSTOMER).count({
            where: {
                company: company.id,
                leadMeta: {
                    daysToConvert: {
                        $notNull: true,
                    },
                    leadCreatedAt: {
                        $gte: startOfMonth,
                        $lte: endOfMonth,
                    },
                },
            },
        });

        const convertedButCreatedLastMonth = await strapi.query(CUSTOMER).count({
            where: {
                company: company.id,
                leadMeta: {
                    daysToConvert: {
                        $notNull: true,
                    },
                    leadCreatedAt: {
                        $gte: startOfLastMonth,
                        $lte: endOfLastMonth,
                    },
                },
            },
        });

        const leadsConvertedThisMonth = await strapi.query(CUSTOMER).count({
            where: {
                company: company.id,
                leadMeta: {
                    daysToConvert: {
                        $notNull: true,
                    },
                },
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth,
                },
            },
        });

        const leadsConvertedLastMonth = await strapi.query(CUSTOMER).count({
            where: {
                company: company.id,
                leadMeta: {
                    daysToConvert: {
                        $notNull: true,
                    },
                },
                createdAt: {
                    $gte: startOfLastMonth,
                    $lte: endOfLastMonth,
                },
            },
        });

        const activitiesThisMonth = await strapi.query(CONTACT_INTERACTION).count({
            where: {
                company: company.id,
                $or: [
                    {
                        $and: [
                            {
                                lead: {
                                    id: {
                                        $notNull: true,
                                    },
                                },
                            },
                            {
                                createdAt: {
                                    $gte: startOfMonth,
                                    $lte: endOfMonth,
                                },
                            },
                        ],
                    },
                    {
                        $and: [
                            {
                                customer: {
                                    leadMeta: {
                                        daysToConvert: {
                                            $notNull: true,
                                        },
                                    },
                                },
                            },
                            {
                                // createdAt : {
                                //     $gte : startOfMonth,
                                //     $lte : strapi.query( CUSTOMER ).model,
                                // }, 
                            },
                        ],
                    },
                ],
            },
        });

        const activitiesLastMonth = await strapi.query(CONTACT_INTERACTION).count({
            where: {
                company: company.id,
                createdAt: {
                    $gte: startOfLastMonth,
                    $lte: endOfLastMonth,
                },
            },
        });

        const totalValue = await strapi.db.connection.raw(`
            SELECT
                SUM(leads.value) AS totalValue
            FROM leads
            JOIN leads_company_links as leads_company ON leads.id = leads_company.lead_id
            WHERE leads_company.company_id = ${company.id}
                AND leads.is_active = 1
        `);

        return {
            active,
            inactive,
            new: {
                current: leadsThisMonth + convertedButCreatedThisMonth,
                passed: leadsLastMonth + convertedButCreatedLastMonth,
            },
            converted: {
                current: leadsConvertedThisMonth,
                passed: leadsConvertedLastMonth,
            },
            activities: {
                current: activitiesThisMonth,
                passed: activitiesLastMonth,
            },
            value: {
                current: 0,
                passed: 0,
            },
            totalValue: totalValue[0][0].totalValue ?? 0,
        };
    },

    async keyFind({ key, value }, tags = []) {
        const ctx = strapi.requestContext.get();

        let entityId;

        switch (key) {
            case "responsible":
                if (value) {
                    const { id: responsibleId } = await findOneByUuid(value, USER);

                    entityId = responsibleId;
                } else {
                    entityId = null;
                }
                break;

            case "group":
                if (value) {
                    const { id: groupId } = await findOneByUuid(value, CONTACT_GROUP);

                    entityId = groupId;
                } else {
                    entityId = null;
                }
                break;

            case "source":
                if (value) {
                    const { id: sourceId } = await findOneByUuid(value, CONTACT_SOURCE);

                    entityId = sourceId;
                } else {
                    entityId = null;
                }
                break;

            case "tags":
                const { id: tagId, uuid, entity } = await findOneByUuid(value, TAG);

                if (entity !== "contact") {
                    throw new BadRequestError(`The tag ${value} is not a contact tag`, {
                        key: "lead.invalidTag",
                        path: ctx.request.url,
                    });
                }

                const index = tags.findIndex(t => t.uuid === uuid);

                if (index === -1) {
                    tags.push(tagId);
                } else {
                    tags.splice(index, 1);
                }

                entityId = tags;
                break;

            case "rating":
                entityId = value;
                break;

            default:
                throw new BadRequestError(`The key ${key} is not supported in key update`, {
                    key: "lead.unkownKey",
                    path: ctx.request.url,
                });
        }

        return entityId;
    },

    async validateParallelData(data) {
        const ctx = strapi.requestContext.get();

        if (data.responsible) {
            const { id: responsibleId } = await findOneByUuid(data.responsible, USER);

            data.responsible = responsibleId;
        }

        if (data.group) {
            const { id: groupId } = await findOneByUuid(data.group, CONTACT_GROUP);

            data.group = groupId;
        }

        if (data.source) {
            const { id: sourceId } = await findOneByUuid(data.source, CONTACT_SOURCE);

            data.source = sourceId;
        }

        if (data.tags) {
            for (let i = 0; i < data.tags.length; i++) {
                const tag = data.tags[i];
                const { id: tagId, uuid, entity } = await findOneByUuid(tag, TAG);

                if (entity !== "contact") {
                    throw new BadRequestError(`The tag with uuid ${uuid} is not a contact tag`, {
                        key: "lead.invalidTag",
                        path: ctx.request.url,
                    });
                }

                data.tags[i] = tagId;
            }
        }
    },

    async getActivityStats(lead) {
        const timeZone = "America/Mexico_City";
        const date = moment.tz(timeZone).startOf("week").add(1, "days");

        const weekDays = [date.toISOString()];

        date.add(1, "days");

        while (date.day() !== 0) {
            weekDays.push(date.toISOString());
            date.add(1, "days");
        }

        weekDays.push(date.toISOString());

        const data = [];
        let hasData = false;

        for (let i = 0; i < weekDays.length - 1; i++) {
            const day = weekDays[i];

            const activities = await strapi.query(CONTACT_INTERACTION).count({
                where: {
                    createdAt: {
                        $gte: day,
                        $lt: weekDays[i + 1],
                    },
                    lead: lead.id,
                },
            });

            if (activities > 0) hasData = true;

            data.push([i, activities]);
        }

        if (hasData) {
            lead.stats = {};
            lead.stats.activities = data;
        }
    },

    async getEstimatesChartData(uuid) {
        const chartData = await strapi.db.connection.raw(`
            WITH lead_estimates AS (
                SELECT
                    e.id AS estimate_id
                FROM
                    estimates e
                    JOIN estimates_lead_links ell ON e.id = ell.estimate_id
                    JOIN leads l ON ell.lead_id = l.id
                WHERE
                    l.uuid = '${uuid}'
            ),
            filtered_versions AS (
                SELECT
                    id AS version_id,
                    date
                FROM
                    components_estimate_versions
                WHERE
                    is_active = 1
            ),
            filtered_components AS (
                SELECT
                    ec.entity_id AS estimate_id,
                    fv.version_id,
                    -- Tomamos el ID de la versión activa
                    cer.total,
                    fv.date
                FROM
                    estimates_components ec
                    JOIN filtered_versions fv ON ec.component_id = fv.version_id -- Aquí aseguramos que el component_id de estimates_components lleve a la versión correcta
                    JOIN components_estimate_versions_components cec ON fv.version_id = cec.entity_id -- Relacionamos con la versión de estimate
                    JOIN components_estimate_resumes cer ON cec.component_id = cer.id -- Aseguramos que resume sea el correcto
                WHERE
                    ec.field = 'versions'
                    AND cec.field = 'resume'
            )
            SELECT
                fc.date AS date, COALESCE(SUM(fc.total), 0) AS sumatory
            FROM
                filtered_components fc
                JOIN lead_estimates le ON fc.estimate_id = le.estimate_id
            WHERE
                fc.date BETWEEN CURDATE() - INTERVAL 1 YEAR
                AND CURDATE()
            GROUP BY
                fc.date
            ORDER BY
                fc.date DESC;
        `);

        const dataArray = chartData[0];
        const resultObject = {};

        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - 365);

        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            resultObject[dateStr] = 0;
        }

        dataArray.forEach(item => {
            resultObject[item.date] = item.sumatory;
        });

        return resultObject;
    },

    async getInteractionsCalendarData(uuid) {
        const result = await strapi.db.connection.raw(`
          WITH lead_target AS (
            SELECT id FROM leads WHERE uuid = '${uuid}'
          ),
          interactions_for_lead AS (
            SELECT
              DATE(ci.created_at) AS date,
              COUNT(*) AS total
            FROM
              contact_interactions ci
              JOIN contact_interactions_lead_links link ON ci.id = link.contact_interaction_id
              JOIN lead_target lt ON link.lead_id = lt.id
            WHERE
              ci.created_at >= CURDATE() - INTERVAL 6 MONTH
            GROUP BY
              DATE(ci.created_at)
          )
          SELECT
            date,
            total
          FROM
            interactions_for_lead
          ORDER BY
            date ASC;
        `);

        const rows = result[0];

        const today = new Date();
        const startDate = new Date();
        startDate.setMonth(today.getMonth() - 5);
        startDate.setDate(1);

        const dataMap = {};

        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dataMap[dateStr] = 0;
        }

        rows.forEach(({ date, total }) => {
            const dateStr = new Date(date).toISOString().split('T')[0];
            dataMap[dateStr] = total;
        });

        return Object.entries(dataMap);
    },

    async getProductsOfInterest(uuid) {
        const products = await strapi.db.connection.raw(`
            WITH lead_estimates AS (
                -- Obtiene las cotizaciones asociadas al lead especificado
                SELECT
                    e.id AS estimate_id
                FROM
                    estimates e
                    JOIN estimates_lead_links ell ON e.id = ell.estimate_id
                    JOIN leads l ON ell.lead_id = l.id
                WHERE
                    l.uuid = '${uuid}'
            ),
            filtered_versions AS (
                -- Obtiene solo las versiones activas de cotización
                SELECT
                    id AS version_id
                FROM
                    components_estimate_versions
                WHERE
                    is_active = 1
            ),
            filtered_items AS (
                -- Filtra los items dentro de estimates_components relacionados a una versión activa
                SELECT
                    ec.entity_id AS estimate_id,
                    fv.version_id,
                    ceei.id AS estimate_item_id,
                    ceei.quantity,
                    ceei.price,
                    ceei.iva
                FROM
                    estimates_components ec
                    JOIN filtered_versions fv ON ec.component_id = fv.version_id -- Vincula estimates_components con la versión activa
                    JOIN components_estimate_versions_components cec ON fv.version_id = cec.entity_id -- Vincula con componentes de la versión
                    JOIN components_estimate_estimate_items ceei ON cec.component_id = ceei.id -- Vincula con los estimate_items
                WHERE
                    ec.field = 'versions'
                    AND cec.field = 'items'
            ),
            products_linked AS (
                -- Vincula los productos con los estimate_items
                SELECT
                    fi.estimate_id,
                    fi.estimate_item_id,
                    fi.quantity,
                    fi.price,
                    fi.iva,
                    pl.product_id
                FROM
                    filtered_items fi
                    JOIN components_estimate_estimate_items_product_links pl ON fi.estimate_item_id = pl.estimate_item_id
            )
            SELECT
                p.id AS id,
                p.uuid AS uuid,
                p.name AS name,
                p.sku AS sku,
                SUM(pl.quantity) AS totalQuantity -- Sumamos la cantidad de cada producto
            FROM
                products_linked pl
                JOIN products p ON pl.product_id = p.id
                JOIN lead_estimates le ON pl.estimate_id = le.estimate_id
            GROUP BY
                p.id,
                p.uuid,
                p.name,
                p.sku
            ORDER BY
                totalQuantity DESC -- Ordenamos por la cantidad total de productos cotizados
            LIMIT 15;  -- Nos aseguramos de traer solo 15 productos únicos
        `);

        const dataArray = products[0];

        return dataArray;
    },

    async getCategoriesOfInterest(uuid) {
        const categories = await strapi.db.connection.raw(`
            WITH lead_estimates AS (
                -- Cotizaciones asociadas al lead (prospecto) especificado
                SELECT
                    e.id AS estimate_id
                FROM
                    estimates e
                    JOIN estimates_lead_links ell ON e.id = ell.estimate_id
                    JOIN leads l ON ell.lead_id = l.id
                WHERE
                    l.uuid = '${uuid}'
            ),
            filtered_versions AS (
                -- Sólo las versiones activas de cotización
                SELECT
                    id AS version_id
                FROM
                    components_estimate_versions
                WHERE
                    is_active = 1
            ),
            filtered_items AS (
                -- Filtrar items dentro de estimates_components relacionados a una versión activa
                SELECT
                    ec.entity_id AS estimate_id,
                    fv.version_id,
                    ceei.id AS estimate_item_id,
                    ceei.quantity,
                    ceei.price,
                    ceei.iva
                FROM
                    estimates_components ec
                    JOIN filtered_versions fv ON ec.component_id = fv.version_id
                    JOIN components_estimate_versions_components cec ON fv.version_id = cec.entity_id
                    JOIN components_estimate_estimate_items ceei ON cec.component_id = ceei.id
                WHERE
                    ec.field = 'versions'
                    AND cec.field = 'items'
            ),
            products_linked AS (
                -- Vincula los productos con los estimate_items
                SELECT
                    fi.estimate_id,
                    fi.estimate_item_id,
                    fi.quantity,
                    fi.price,
                    fi.iva,
                    pl.product_id
                FROM
                    filtered_items fi
                    JOIN components_estimate_estimate_items_product_links pl ON fi.estimate_item_id = pl.estimate_item_id
            )
            SELECT
                SUM(pl.quantity) AS value,  -- Cantidad total cotizada por categoría
                pc.name AS name             -- Nombre de la categoría
            FROM
                products_linked pl
                JOIN products_category_links pcl ON pl.product_id = pcl.product_id
                JOIN product_categories pc ON pcl.product_category_id = pc.id
                JOIN lead_estimates le ON pl.estimate_id = le.estimate_id
            GROUP BY
                pc.id, pc.name
            ORDER BY
                value DESC;
        `);

        const dataArray = categories[0];

        return dataArray;
    },

    async prepareLeadData(uuid, data = {}) {
        return await findOneByUuid(uuid, LEAD, {
            fields: [...leadFields.fields],
            populate: {
                createdByUser : true,
                estimates: true,
                ...leadFields.populate,
                ...(data?.tasks && {
                    tasks: true,
                }),
                ...(data?.documents && {
                    documents: true,
                }),
                ...(data?.notes && {
                    notes: true,
                }),
                ...(data?.interactions && {
                    interactions: true,
                }),
            },
        });
    },

    async convertLeadToCustomer(lead, company) {
        const ctx = strapi.requestContext.get();
        const user = ctx.state.user;
        const leadCreation = dayjs(lead.createdAt);
        const today = dayjs();
        const difference = today.diff(leadCreation, "day");

        let id = lead.id;

        delete lead.createdAt;
        delete lead.uuid;
        delete lead.id;

        const customer = await strapi.entityService.create( CUSTOMER, {
            data: {
                ...lead,
                leadMeta: {
                    daysToConvert: difference,
                    convertedAt: new Date(),
                    leadCreatedAt: leadCreation,
                },
                isArchived: false,
                company: company.id,
                createdByUser: user.id,
            },
            fields: ["uuid"],
        });

        lead.id = id;

        return customer;
    },

    async deleteParallelData(id) {
        const estimates = await strapi.db.query(ESTIMATE).findMany({
            where: {
                lead: id,
            },
        });

        for (const estimate of estimates) {
            await strapi.entityService.delete(ESTIMATE, estimate.id);
        }

        const tasks = await strapi.db.query(TASK).findMany({
            where: {
                lead: id,
            },
        });

        for (const task of tasks) {
            await strapi.entityService.delete(TASK, task.id);
        }

        const notes = await strapi.db.query(NOTE).findMany({
            where: {
                lead: id,
            },
        });

        for (const note of notes) {
            await strapi.entityService.delete(NOTE, note.id);
        }

        const interactions = await strapi.db.query(CONTACT_INTERACTION).findMany({
            where: {
                lead: id,
            },
        });

        for (const interaction of interactions) {
            await strapi.entityService.delete(CONTACT_INTERACTION, interaction.id);
        }

        const insiders = await strapi.db.query(INSIDER).findMany({
            where: {
                lead: id,
            },
        });

        for (const insider of insiders) {
            await strapi.entityService.delete(INSIDER, insider.id);
        }
    },

    async generateAddressData({ mainAddress, address }) {
        const generateQuery = ({ street, extNumber, cp, city, state, country }) => {
            if (!street && !extNumber && !cp && !city && !state && country) {
                return country;
            } else if (!street && !extNumber && !cp && !city && state && country) {
                return `${state} ${country}`;
            } else if (!street && !extNumber && !cp && city && state && country) {
                return `${city} ${state} ${country}`;
            } else if (!street && !extNumber && cp && city && state && country) {
                return `${cp} ${city} ${state} ${country}`;
            } else {
                return `${street || ""} ${extNumber || ""} ${cp || ""} ${city || ""} ${state || ""} ${country || ""}`.trim();
            }
        };

        const fetchCoordinates = async (addressData) => {
            const query = generateQuery(addressData);

            const URL = `https://api.mapbox.com/search/geocode/v6/forward?access_token=${process.env.MAPBOX_TOKEN}&proximity=ip&q=${encodeURI(query)}`;

            try {
                const { data } = await axios.get(URL);

                return {
                    longitude: data.features?.[0]?.geometry?.coordinates?.[0]?.toString(),
                    latitude: data.features?.[0]?.geometry?.coordinates?.[1]?.toString(),
                }
            } catch (error) {
                console.error("Error fetching coordinates:", error);
            }
        };

        if (mainAddress) {
            const coordinates = await fetchCoordinates(mainAddress);

            mainAddress.longitude = coordinates.longitude;
            mainAddress.latitude = coordinates.latitude;

            return;
        }

        if (address) {
            const coordinates = await fetchCoordinates(address);

            address.longitude = coordinates.longitude;
            address.latitude = coordinates.latitude;

            return;
        }
    }
}));
