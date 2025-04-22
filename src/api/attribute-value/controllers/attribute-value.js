const { connect } = require('puppeteer');
const { ATTRIBUTE_VALUE, PRODUCT_ATTRIBUTE, PRODUCT, PRODUCT_VARIATION } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate, validateConnect } = require('../content-types/attribute-value/attribute-value.validation');
const { ConflictError } = require('../../../helpers/errors');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(ATTRIBUTE_VALUE, ({ strapi }) => ({
    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        const attribute = await findOneByUuid( PRODUCT_ATTRIBUTE, data.attribute );

        await checkForDuplicates( ATTRIBUTE_VALUE, [
            {
                name : data.name,
            },
            {
                attribute : attribute.id,
            },
        ]);

        const newValue = await strapi.entityService.create( ATTRIBUTE_VALUE, {
            data : {
                name      : data.name,
                attribute : attribute.id,
                company   : company.id,
            },
        });

        return newValue;
    },

    async connectValue(ctx) {
        const data = ctx.request.body;
        const { productUuid, attributeUuid } = ctx.params;

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

        const attribute = await findOneByUuid( attributeUuid, PRODUCT_ATTRIBUTE );
        const value = await findOneByUuid( data.value, ATTRIBUTE_VALUE );

        const attributeIndex = product.attributes.findIndex( attr => attr.attribute.uuid === attribute.uuid );

        if (attributeIndex === -1) {
            throw new ConflictError("The product doesn't have this attribute", {
                key : "product.duplicatedAttribute",
                path : ctx.request.path,
            });
        }

        const hasValue = product.attributes[attributeIndex].values.find( val => val.uuid === data.value );

        if ( hasValue ) {
            throw new ConflictError("The product already has this value", {
                key : "product.duplicatedValue",
                path : ctx.request.path,
            });
        }

        let newAttributes = product.attributes;

        newAttributes[ attributeIndex ].values.push({
            id : value.id
        });

        const updatedProduct = await strapi.entityService.update( PRODUCT, product.id, {
            data : {
                attributes : newAttributes,
            },
        });

        return updatedProduct;
    },

    async disconnectValue(ctx) {
        const { productUuid, attributeUuid, uuid } = ctx.params;

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

        const attribute = await findOneByUuid( attributeUuid, PRODUCT_ATTRIBUTE );
        const value = await findOneByUuid( uuid, ATTRIBUTE_VALUE );

        const attributeIndex = product.attributes.findIndex( attr => attr.attribute.uuid === attribute.uuid );

        if (attributeIndex === -1) {
            throw new ConflictError("The product doesn't have this attribute", {
                key : "product.duplicatedAttribute",
                path : ctx.request.path,
            });
        }

        const hasValue = product.attributes[attributeIndex].values.find( val => val.uuid === value.uuid );

        if ( !hasValue ) {
            throw new ConflictError("The product doesn't have this value", {
                key : "product.duplicatedValue",
                path : ctx.request.path,
            });
        }

        let newAttributes = product.attributes;

        newAttributes[ attributeIndex ].values = newAttributes[ attributeIndex ].values.filter( val => val.uuid !== value.uuid );

        await strapi.service(ATTRIBUTE_VALUE).removeVariationsByValue(product.id, attribute.uuid);

        const updatedProduct = await strapi.entityService.update( PRODUCT, product.id, {
            data : {
                attributes : newAttributes,
            },
        });

        return updatedProduct;
    },

    async findRelations(ctx) {
        const { uuid, productUuid } = ctx.params;

        const product = await findOneByUuid( productUuid, PRODUCT );
        const value = await findOneByUuid( uuid, ATTRIBUTE_VALUE );

        const variations = await strapi.query( PRODUCT_VARIATION ).count({
            where : {
                values : value.id,
                product : product.id,
            },
        });

        return {
            variations,
        };
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const value = await findOneByUuid( uuid, ATTRIBUTE_VALUE );

        await checkForDuplicates( ATTRIBUTE_VALUE, [
            {
                name : data.name,
            },
            {
                attribute : value.attribute,
            },
        ]);

        const updatedValue = await strapi.entityService.update( ATTRIBUTE_VALUE, value.id, {
            data : {
                name : data.name,
            },
        });

        return updatedValue;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const value = await findOneByUuid( uuid, ATTRIBUTE_VALUE );

        // TODO: Verificar que no haya variaciones ni productos asignados con este valor

        const deletedValue = await strapi.entityService.delete( ATTRIBUTE_VALUE, value.id );

        return deletedValue;
    },
}));
