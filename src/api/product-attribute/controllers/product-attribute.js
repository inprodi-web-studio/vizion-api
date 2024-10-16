const { PRODUCT_ATTRIBUTE, PRODUCT } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const { ConflictError } = require('../../../helpers/errors');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate, validateConnect } = require('../content-types/product-attribute/product-attribute.validation');

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

    async getProductAttributes(ctx) {
        const { productUuid } = ctx.params;

        const product = await findOneByUuid( productUuid, PRODUCT, {
            populate : {
                attributes : {
                    populate : {
                        attribute : true,
                        values    : true,
                    },
                },
            },
        });

        return product.attributes;
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

    async connectAttribute(ctx) {
        const data = ctx.request.body;
        const { productUuid } = ctx.params;

        await validateConnect( data );

        const product = await findOneByUuid( productUuid, PRODUCT, {
            populate : {
                attributes : {
                    populate : {
                        attribute : true,
                        values    : true,
                    },
                },
            },
        });

        await strapi.service( PRODUCT_ATTRIBUTE ).validateParallelData( data );

        const hasAttribute = product.attributes.find( attr => attr.attribute.uuid === data.attribute );

        if ( hasAttribute ) {
            throw new ConflictError("The product already has this attribute", {
                key : "product.duplicatedAttribute",
                path : ctx.request.path,
            });
        }

        const updatedProduct = await strapi.entityService.update( PRODUCT, product.id, {
            data : {
                attributes : [
                    ...product.attributes,
                    data,
                ],
            },
            ...productAttributeFields
        });

        return updatedProduct;
    },

    async disconnectAttribute(ctx) {
        const { productUuid, uuid } = ctx.params;

        const product = await findOneByUuid( productUuid, PRODUCT, {
            populate : {
                attributes : {
                    populate : {
                        attribute : true,
                        values    : true,
                    },
                },
            },
        });

        const attribute = await findOneByUuid( uuid, PRODUCT_ATTRIBUTE );

        const hasAttribute = product.attributes.find( attr => attr.attribute.uuid === attribute.uuid );

        if ( !hasAttribute ) {
            throw new ConflictError("The product doesn't have this attribute", {
                key : "product.duplicatedAttribute",
                path : ctx.request.path,
            });
        }

        const updatedProduct = await strapi.entityService.update( PRODUCT, product.id, {
            data : {
                attributes : product.attributes.filter( attr => attr.uuid !== attribute.uuid ),
            },
            ...productAttributeFields
        });

        return updatedProduct;
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
