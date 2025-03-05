const { PACKAGE, PRODUCT, PRODUCT_VARIATION } = require('../../../constants/models');
const { ConflictError } = require('../../../helpers/errors');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/package/package.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const packageFields = {
    fields : ["uuid", "conversionRate", "realConversion"],
    populate : {
        unity : {
            fields : ["uuid", "name", "abbreviation"],
        },
        referenceUnity : {
            fields : ["uuid", "conversionRate", "realConversion"],
            populate : {
                unity : {
                    fields : ["uuid", "name", "abbreviation"],
                },
            },
        },
    },
};

module.exports = createCoreController(PACKAGE, ({ strapi }) => ({
    async find(ctx) {
        const { productUuid, variationUuid } = ctx.params;

        let filters = {};

        if (productUuid) {
            const product = await findOneByUuid( productUuid, PRODUCT );

            filters = {
                product : product.id,
            };
        }

        if (variationUuid) {
            const variation = await findOneByUuid( variationUuid, PRODUCT_VARIATION );

            filters = {
                variation : variation.id,
            };
        }

        const packages = await findMany( PACKAGE, packageFields, {
            ...filters,
            $search : [
                "unity.name",
            ],
        });

        return packages;
    },

    async create(ctx) {
        const { productUuid, variationUuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        if (productUuid) {
            const product = await findOneByUuid( productUuid, PRODUCT );

            const samePackage = await strapi.query( PACKAGE ).count({
                where : {
                    product : product.id,
                    unity : {
                        uuid : data.unity,
                    },
                },
            });
    
            if ( samePackage > 0 ) {
                throw new ConflictError( "Package with this unity already exists", {
                    key  : "package.duplicatedUnity",
                    path : ctx.request.path,
                });
            }
    
            await strapi.service( PACKAGE ).validateParallelData( data );
    
            const newPackage = await strapi.entityService.create( PACKAGE, {
                data : {
                    ...data,
                    product : product.id,
                },
            });
    
            return newPackage;
        }

        if (variationUuid) {
            const variation = await findOneByUuid( variationUuid, PRODUCT_VARIATION );

            const samePackage = await strapi.query( PACKAGE ).count({
                where : {
                    variation : variation.id,
                    unity : {
                        uuid : data.unity,
                    },
                },
            });
    
            if ( samePackage > 0 ) {
                throw new ConflictError( "Package with this unity already exists", {
                    key  : "package.duplicatedUnity",
                    path : ctx.request.path,
                });
            }
    
            await strapi.service( PACKAGE ).validateParallelData( data );
    
            const newPackage = await strapi.entityService.create( PACKAGE, {
                data : {
                    ...data,
                    variation : variation.id,
                },
            });
    
            return newPackage;
        }
    },

    async update(ctx) {
        const { productUuid, variationUuid, uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const package = await findOneByUuid( uuid, PACKAGE );

        if (productUuid) {
            const product = await findOneByUuid( productUuid, PRODUCT );

            const samePackage = await strapi.query( PACKAGE ).count({
                where : {
                    uuid : {
                        $not : package.uuid,
                    },
                    product : product.id,
                    unity : {
                        uuid : data.unity,
                    },
                },
            });
    
            if ( samePackage > 0 ) {
                throw new ConflictError( "Package with this unity already exists", {
                    key  : "package.duplicatedUnity",
                    path : ctx.request.path,
                });
            }
    
            await strapi.service( PACKAGE ).validateParallelData( data );
    
            await strapi.service( PACKAGE ).updateReferencedPackages( data, package );
        }

        if (variationUuid) {
            const variation = await findOneByUuid( variationUuid, PRODUCT_VARIATION );

            const samePackage = await strapi.query( PACKAGE ).count({
                where : {
                    uuid : {
                        $not : package.uuid,
                    },
                    variation : variation.id,
                    unity : {
                        uuid : data.unity,
                    },
                },
            });
    
            if ( samePackage > 0 ) {
                throw new ConflictError( "Package with this unity already exists", {
                    key  : "package.duplicatedUnity",
                    path : ctx.request.path,
                });
            }
    
            await strapi.service( PACKAGE ).validateParallelData( data );
    
            await strapi.service( PACKAGE ).updateReferencedPackages( data, package );
        }

        const updatedPackage = await strapi.entityService.update( PACKAGE, package.id, {
            data : {
                ...data,
            },
        });

        return updatedPackage;
    },

    async delete(ctx) {
        const { productUuid, variationUuid, uuid } = ctx.params;

        const package = await findOneByUuid( uuid, PACKAGE );

        // TODO: No permitir eliminar si existen relaciones con el paquete

        if (productUuid) {
            await findOneByUuid( productUuid, PRODUCT );
        }

        if (variationUuid) {
            await findOneByUuid( variationUuid, PRODUCT_VARIATION );
        }

        await strapi.service( PACKAGE ).updateOrphanPackages( package );

        const deletedPackage = await strapi.entityService.delete( PACKAGE, package.id, packageFields );

        return deletedPackage;
    },
}));
