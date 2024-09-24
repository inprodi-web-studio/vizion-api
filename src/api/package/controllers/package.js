const { PACKAGE, PRODUCT } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
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

        await checkForDuplicates( PACKAGE, [
            {
                product : product.id,
                unity : {
                    uuid : data.unity,
                },
            },
        ], {}, false );

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

        await checkForDuplicates( PACKAGE, [
            {
                product : product.id,
                unity : {
                    uuid : data.unity,
                },
            },
        ], {}, false );

        await strapi.service( PACKAGE ).validateParallelData( data );

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
