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

    async createPositions( shelfId, { xPositions, yPositions } ) {
        const positions = [];

        for (let x = 0; x < xPositions; x++) {
          for (let y = 0; y < yPositions; y++) {
            positions.push({
                xPosition: x,
                yPosition: y,
                shelf: shelfId,
            });
          }
        }
      
        await strapi.db.query(SHELF_POSITION).createMany({
          data : positions,
        });
    },
}));
