const { PRODUCT_FAMILY } = require("../../../constants/models");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateCreate } = require("../content-types/product-family/product-family.validation");

const { createCoreController } = require("@strapi/strapi").factories;

const productFamilyFields = {
    fields : ["uuid", "name"],
    populate : {
        parentId : {
            fields : ["uuid", "name"],
        },
        children : {
            fields : ["uuid", "name"],
            populate : {
                parentId : {
                    fields : ["uuid", "name"],
                },
            },
        },
    },
};

module.exports = createCoreController( PRODUCT_FAMILY, ({ strapi }) => ({
    async find(ctx) {
        const { company } = ctx.state;
        const { search } = ctx.query;

        const families = await strapi.entityService.findMany(PRODUCT_FAMILY, {
            filters : {
                company : company.id,
            },
            fields : ["uuid", "name"],
            populate : {
                parentId : {
                    fields : ["uuid", "name"],
                },
            },
            sort : {
                name : "asc",
            },
        });

        const familyTree = strapi.service(PRODUCT_FAMILY).formatTree(families);

        return strapi.service(PRODUCT_FAMILY).filterTreeBySearch(familyTree, search);
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate(data);

        const parentFamily = await strapi
            .service(PRODUCT_FAMILY)
            .resolveParentByUuid(data.parentId);

        await strapi.service(PRODUCT_FAMILY).validateParent(parentFamily);
        await strapi
            .service(PRODUCT_FAMILY)
            .validateDuplicateName(data.name, parentFamily?.id ?? null);

        const newFamily = await strapi.entityService.create(PRODUCT_FAMILY, {
            data : {
                ...data,
                parentId : parentFamily?.id ?? null,
                company : company.id,
            },
            ...productFamilyFields,
        });

        return newFamily;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate(data);

        const family = await findOneByUuid(uuid, PRODUCT_FAMILY, productFamilyFields);

        const parentHasChanged = Object.prototype.hasOwnProperty.call(data, "parentId");

        const parentFamily = parentHasChanged
            ? await strapi.service(PRODUCT_FAMILY).resolveParentByUuid(data.parentId)
            : family.parentId;

        if (parentHasChanged) {
            await strapi.service(PRODUCT_FAMILY).validateParent(parentFamily, family);
        }

        await strapi
            .service(PRODUCT_FAMILY)
            .validateDuplicateName(data.name, parentFamily?.id ?? null, uuid);

        const updatedFamily = await strapi.entityService.update(PRODUCT_FAMILY, family.id, {
            data : {
                ...data,
                ...( parentHasChanged && {
                    parentId : parentFamily?.id ?? null,
                }),
            },
            ...productFamilyFields,
        });

        return updatedFamily;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const family = await findOneByUuid(uuid, PRODUCT_FAMILY, productFamilyFields);

        const deletedFamily = await strapi.entityService.delete(
            PRODUCT_FAMILY,
            family.id,
            productFamilyFields
        );

        return deletedFamily;
    },
}));
