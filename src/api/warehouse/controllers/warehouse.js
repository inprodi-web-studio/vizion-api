const { WAREHOUSE } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/warehouse/warehouse.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const warehouseFields = {
    fields : ["uuid", "name", "isActive"],
    populate : {
        address : true,
    },
};

module.exports = createCoreController(WAREHOUSE, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
            ],
        };

        const warehouses = await findMany( WAREHOUSE, warehouseFields, filters );

        return warehouses;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( WAREHOUSE, [
            {
                name : data.name,
            },
        ]);

        await strapi.service(WAREHOUSE).generateAddressData(data);

        const newWarehouse = await strapi.entityService.create(WAREHOUSE, {
            data : {
                ...data,
                isActive : false,
                company : company.id,
            },
            ...warehouseFields
        });

        return newWarehouse;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const warehouse = await findOneByUuid( uuid, WAREHOUSE );

        await checkForDuplicates( WAREHOUSE, [
            {
                name : data.name,
            },
        ]);

        await strapi.service(WAREHOUSE).generateAddressData(data);

        const updatedWarehouse = await strapi.entityService.update(WAREHOUSE, warehouse.id, {
            data : {
                ...data,
            },
            ...warehouseFields
        });

        return updatedWarehouse;
    },

    async toggle(ctx) {
        const { uuid } = ctx.params;

        const { id, isActive } = await findOneByUuid( uuid, WAREHOUSE );

        const updatedWarehouse = await strapi.entityService.update(WAREHOUSE, id, {
            data : {
                isActive : !isActive,
            },
            ...warehouseFields
        });

        return updatedWarehouse;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, WAREHOUSE );

        const deletedWarehouse = await strapi.entityService.delete( WAREHOUSE, id, warehouseFields );

        return deletedWarehouse;
    },
}));
