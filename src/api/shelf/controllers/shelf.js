const { SHELF } = require('../../../constants/models');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/shelf/shelf.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const shelfFields = {
    fields : ["uuid", "name", "xPositions", "yPositions"],
    populate : {
        location : {
            fields : ["uuid", "name"],
        },
    },
};

module.exports = createCoreController(SHELF, ({ strapi }) => ({
    async create(ctx) {
        const data = ctx.request.body;

        await validateCreate( data );

        await strapi.service(SHELF).validateParallelData(data);
        await strapi.service(SHELF).checkForDuplicates(data);

        const newShelf = await strapi.entityService.create( SHELF, {
            data,
            ...shelfFields
        });

        await strapi.service(SHELF).createPositions( newShelf.id, data );

        return newShelf;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, SHELF );

        await strapi.service(SHELF).deleteParallelData(id);

        const deletedShelf = await strapi.entityService.delete( SHELF, id, shelfFields );

        return deletedShelf;
    },
}));
