const { STOCK_RELEASE, STOCK_RESERVATION } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const stock = require('../../stock/controllers/stock');

const { createCoreController } = require('@strapi/strapi').factories;

const releaseFields = {
    fields : ["uuid", "quantity", "realQuantity", "releaseDate", "isCompleted"],
    populate : {
        product : {
            select : ["uuid", "name", "sku", "type"],
            populate : {
                images : {
                    select : ["url"],
                },
                stockInfo : true,
            },
        },
        unity : {
            fields : ["uuid", "name", "abbreviation"],
        },
        package : {
            fields : ["uuid", "conversionRate", "realConversion"],
            populate : {
                unity : true,
            },
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
        sale : {
            fields : ["uuid", "fol", "subject"],
        },
    },
};

module.exports = createCoreController( STOCK_RELEASE, ({ strapi }) => ({
    async find(ctx) {
        const company = ctx.state.company;

        const filters = {
            $search : [
                "product.name",
                "product.sku",
                "variation.sku",
            ],
            company : company.id,
        };

        const releases = await findMany( STOCK_RELEASE, releaseFields, filters, false );

        return releases;
    },

    async reserveStock(ctx) {
        const { uuid } = ctx.params;

        const release = await findOneByUuid( uuid, STOCK_RELEASE, releaseFields );

        await strapi.service( STOCK_RESERVATION ).registerReservations([release], release.sale.id, release.id);

        return release;
    },
}));