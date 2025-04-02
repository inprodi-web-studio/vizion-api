const { PLATFORM, WAREHOUSE } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/platform/platform.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const platformFields = {
    fields : ["uuid", "name", "allowEntrances", "allowExits"],
    populate : {
        warehouse : {
            fields : ["uuid", "name"],
        },
    },
};

module.exports = createCoreController( PLATFORM, ({ strapi }) => ({
    async find(ctx) {
        const { uuid } = ctx.params;

        const warehouse = await findOneByUuid( uuid, WAREHOUSE );

        const filters = {
            $search : [
                "name",
            ],
            warehouse : warehouse.id,
        };

        const platforms = await findMany( PLATFORM, platformFields, filters, false );

        return platforms;
    },

    async create(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateCreate(data);

        const warehouse = await findOneByUuid( uuid, WAREHOUSE );

        await strapi.service(PLATFORM).checkForDuplicates(data, warehouse);

        const newPlatform = await strapi.entityService.create( PLATFORM, {
            data : {
                ...data,
                warehouse : warehouse.id,
            },
            ...platformFields
        });

        return newPlatform;
    },

    async update(ctx) {
        const { uuid, platformUuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const warehouse = await findOneByUuid( uuid, WAREHOUSE );
        const platform = await findOneByUuid( platformUuid, PLATFORM );

        await strapi.service(PLATFORM).checkForDuplicates(data, warehouse);

        const updatedPlatform = await strapi.entityService.update( PLATFORM, platform.id, {
            data : {
                ...data,
            },
            ...platformFields
        });

        return updatedPlatform;
    },

    async delete(ctx) {
        const { uuid, platformUuid } = ctx.params;

        await findOneByUuid( uuid, WAREHOUSE );

        const platform = await findOneByUuid( platformUuid, PLATFORM );

        const deletedPlatform = await strapi.entityService.delete( PLATFORM, platform.id, platformFields );

        return deletedPlatform;
    },
}));
