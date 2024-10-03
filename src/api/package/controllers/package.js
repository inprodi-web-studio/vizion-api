const { PACKAGE, PRODUCT } = require('../../../constants/models');
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
            fields : ["uuid"],
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
        const { productUuid } = ctx.params;

        const product = await findOneByUuid( productUuid, PRODUCT );

        const filters = {
            product : product.id,
        };

        const packages = await findMany( PACKAGE, packageFields, filters );

        return packages;
    },

    async create(ctx) {
        const { productUuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

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
    },

    async update(ctx) {
        const { productUuid, uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const product = await findOneByUuid( productUuid, PRODUCT );
        const package = await findOneByUuid( uuid, PACKAGE );

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

        await strapi.serivce( PACKAGE ).updateReferencedPackages( data );

        const updatedPackage = await strapi.entityService.update( PACKAGE, package.id, {
            data : {
                ...data,
            },
        });

        return updatedPackage;
    },

    async delete(ctx) {
        const { productUuid, uuid } = ctx.params;

        await findOneByUuid( productUuid, PRODUCT );
        const package = await findOneByUuid( uuid, PACKAGE );

        // TODO: No permitir eliminar si existen relaciones con el paquete

        const deletedPackage = await strapi.entityService.delete( PACKAGE, package.id, packageFields );

        return deletedPackage;
    },
}));
