const { PRODUCT_ATTRIBUTE } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/product-attribute/product-attribute.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const productAttributeFields = {
    fields : ["uuid", "name"],
    populate : {
        values : true,
    },
};

module.exports = createCoreController( PRODUCT_ATTRIBUTE, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
            ],
        };

        const attributes = await findMany( PRODUCT_ATTRIBUTE, productAttributeFields, filters );

        return attributes;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( PRODUCT_ATTRIBUTE, [
            {
                name : data.name,
            },
        ]);

        const newAttribute = await strapi.entityService.create( PRODUCT_ATTRIBUTE, {
            data : {
                ...data,
                company : company.id,
            },
            ...productAttributeFields,
        });

        return newAttribute;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const attribute = await findOneByUuid( uuid, PRODUCT_ATTRIBUTE );

        await checkForDuplicates( PRODUCT_ATTRIBUTE, [
            {
                name : data.name,
            }
        ]);

        const updatedAttribute = await strapi.entityService.update( PRODUCT_ATTRIBUTE, attribute.id, {
            data : {
                ...data,
            },
            ...productAttributeFields
        });

        return updatedAttribute;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const attribute = await findOneByUuid( uuid, PRODUCT_ATTRIBUTE );

        const deletedAttribute = await strapi.entityService.delete( PRODUCT_ATTRIBUTE, attribute.id, productAttributeFields );

        return deletedAttribute;
    },
}));
