const { STOCK_LOCATION, SHELF, SHELF_POSITION } = require('../../../constants/models');
const { ConflictError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(STOCK_LOCATION, ({ strapi }) => ({
    async checkForDuplicates(data, warehouse) {
        const ctx = strapi.requestContext.get();
        const method = ctx.request.method;

        const conflictingNameLocations = await strapi.query( STOCK_LOCATION ).count({
            where : {
                name : data.name,
                warehouse : warehouse.id,
                ...( method === "PUT" && ({
                    uuid : {
                        $not: ctx.params.locationUuid
                    },
                }))
            },
        });

        if ( conflictingNameLocations > 0 ) {
            throw new ConflictError( "Stock location with this name already exists", {
                key : "stock-location.duplicatedName",
                path : ctx.request.path,
            });
        }

        const conflictingIdentifierLocations = await strapi.query( STOCK_LOCATION ).count({
            where : {
                identifier : data.identifier,
                warehouse : warehouse.id,
                ...( method === "PUT" && ({
                    uuid : {
                        $not: ctx.params.locationUuid
                    },
                }))
            },
        });

        if ( conflictingIdentifierLocations > 0 ) {
            throw new ConflictError( "Stock location with this identifier already exists", {
                key : "stock-location.duplicatedIdentifier",
                path : ctx.request.path,
            });
        }
    },

    async deleteParallelData( stockLocationId ) {
        const promises = [];

        const shelfs = await strapi.query( SHELF ).findMany({
            where : {
                location : stockLocationId,
            },
        });

        const shelfPositions = await strapi.query( SHELF_POSITION ).findMany({
            where : {
                shelf : {
                    location : stockLocationId,
                },
            },
        });

        for ( const { id } of shelfPositions ) {
            promises.push( strapi.entityService.delete( SHELF_POSITION, id ) );
        }

        for ( const { id } of shelfs ) {
            promises.push( strapi.entityService.delete( SHELF, id ) );
        }

        await Promise.all( promises );
    },
}));
