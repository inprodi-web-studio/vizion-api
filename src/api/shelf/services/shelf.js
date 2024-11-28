const { uuid } = require('uuidv4');
const { SHELF, STOCK_LOCATION, SHELF_POSITION } = require('../../../constants/models');
const { ConflictError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(SHELF, ({ strapi }) => ({
    async validateParallelData(data) {
        const { id : locationId } = await findOneByUuid( data.location, STOCK_LOCATION );
        data.location = locationId;
    },

    async checkForDuplicates(data) {
        const ctx = strapi.requestContext.get();
        const conflictingShelf = await strapi.query( SHELF ).count({
            where : {
                name : data.name,
                location : data.location,
            },
        });

        if ( conflictingShelf > 0 ) {
            throw new ConflictError( "Shelf with this name already exists for the location", {
                key : "shelf.duplicatedName",
                path : ctx.request.path,
            });
        }
    },

    async createPositions(shelfId, data) {
        const promises = [];
      
        for ( const { xPosition, yPosition, rotation, partitions } of data.coordinates ) {
            const promise = strapi.entityService.create( SHELF_POSITION, {
                data : {
                    xPosition,
                    yPosition,
                    rotation,
                    partitions,
                    shelf: shelfId,
                },
            });

            promises.push(promise);
        }
      
        await Promise.all(promises);
      },

      async deleteParallelData(shelfId) {
        const promises = [];

        const shelfPositions = await strapi.query( SHELF_POSITION ).findMany({
            where : {
                shelf : shelfId,
            },
        });

        for ( const { id } of shelfPositions ) {
            promises.push( strapi.entityService.delete( SHELF_POSITION, id ) );
        }

        await Promise.all( promises );
      },
}));
