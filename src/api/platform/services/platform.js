const { PLATFORM } = require('../../../constants/models');
const { ConflictError } = require('../../../helpers/errors');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService( PLATFORM, ({ strapi }) => ({
    async checkForDuplicates(data, warehouse) {
        const ctx = strapi.requestContext.get();
        const method = ctx.request.method;

        const conflictingNamePlatforms = await strapi.query( PLATFORM ).count({
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

        if ( conflictingNamePlatforms > 0 ) {
            throw new ConflictError( "Platform with this name already exists", {
                key : "platform.duplicatedName",
                path : ctx.request.path,
            });
        }
    },
}));
