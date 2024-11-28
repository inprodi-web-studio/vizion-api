const { STOCK_LOCATION, WAREHOUSE } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/stock-location/stock-location.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const stockLocationFields = {
    fields : ["uuid", "name", "identifier", "allowDeliveries", "allowDispatches"],
    populate : {
        warehouse : {
            fields : ["uuid", "name"],
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

        await strapi.service(STOCK_LOCATION).checkForDuplicates(data, warehouse);

        const newStockLocation = await strapi.entityService.create( STOCK_LOCATION, {
            data : {
                ...data,
                warehouse : warehouse.id,
            },
            ...stockLocationFields
        });

        return newStockLocation;
    },

    async update(ctx) {
        const { uuid, locationUuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const warehouse = await findOneByUuid( uuid, WAREHOUSE );
        const stockLocation = await findOneByUuid( locationUuid, STOCK_LOCATION );

        await strapi.service(STOCK_LOCATION).checkForDuplicates(data, warehouse);

        const updatedStockLocation = await strapi.entityService.update( STOCK_LOCATION, stockLocation.id, {
            data : {
                ...data,
            },
            ...stockLocationFields
        });

        return updatedStockLocation;

    },

    async delete(ctx) {
        const { uuid, locationUuid } = ctx.params;

        await findOneByUuid( uuid, WAREHOUSE );

        const stockLocation = await findOneByUuid( locationUuid, STOCK_LOCATION );

        await strapi.service(STOCK_LOCATION).deleteParallelData( stockLocation.id );

        const deletedStockLocation = await strapi.entityService.delete( STOCK_LOCATION, stockLocation.id, stockLocationFields );

        return deletedStockLocation;
    },
}));