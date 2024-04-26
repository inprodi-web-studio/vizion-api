const { PRODUCT_CATEGORY } = require("../../../constants/models");
const checkForDuplicates = require("../../../helpers/checkForDuplicates");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateCreate } = require("../content-types/product-category/product-category.validation");

const { createCoreController } = require("@strapi/strapi").factories;

const categoryFields = {
    fields : ["uuid", "name", "color", "icon"],
    populate : {
        products : {
            count : true,
        },
    }
};

module.exports = createCoreController( PRODUCT_CATEGORY, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
            ],
        };

        const categories = await findMany( PRODUCT_CATEGORY, categoryFields, filters );

        return categories;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( PRODUCT_CATEGORY, [
            {
                name : data.name,
            }
        ]);

        const newCategory = await strapi.entityService.create( PRODUCT_CATEGORY, {
            data : {
                ...data,
                company : company.id,
            },
            ...categoryFields,
        });

        return newCategory;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const category = await findOneByUuid( uuid, PRODUCT_CATEGORY );

        await checkForDuplicates( PRODUCT_CATEGORY, [
            {
                name : data.name,
            }
        ]);

        const updatedCategory = await strapi.entityService.update( PRODUCT_CATEGORY, category.id, {
            data : {
                ...data,
            },
            ...categoryFields
        });

        return updatedCategory;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const category = await findOneByUuid( uuid, PRODUCT_CATEGORY );

        const deletedCategory = await strapi.entityService.delete( PRODUCT_CATEGORY, category.id, categoryFields );

        return deletedCategory;
    },
}));
