const { STOCK_LOCATION, WAREHOUSE } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/stock-location/stsock-location.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const stockLocationFields = {
    fields : ["uuid", "name", "identifier", "allowDeliveries", "allowDispatches"],
    populate : {
        warehouse : {
            fields : ["uuid", "name"],
        },
        receivableFrom : {
            fields : ["uuid", "name", "identifier"],
        },
    },
};

module.exports = createCoreController(STOCK_LOCATION, ({ strapi }) => ({
    async find(ctx) {
        const { uuid } = ctx.params;

        const warehouse = await findOneByUuid( uuid, WAREHOUSE );

        const filters = {
            $search : [
                "name",
                "identifier"
            ],
            warehouse : warehouse.id,
        };

        const stockLocations = await findMany( STOCK_LOCATION, stockLocationFields, filters, false );

        return stockLocations;
    },

    async create(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateCreate( data );

        const warehouse = await findOneByUuid( uuid, WAREHOUSE );

        await strapi.service(WAREHOUSE).checkForDuplicates(data, warehouse);
        
        await strapi.service(WAREHOUSE).validateParallelData(data);

        const newStockLocation = await strapi.entityService.create( STOCK_LOCATION, {
            data : {
                ...data,
                warehouse : warehouse.id,
            },
            ...stockLocationFields
        });

        return newStockLocation;
    },
}));
