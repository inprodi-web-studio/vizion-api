const { PRODUCT } = require("../../../constants/models");
const checkForDuplicates = require("../../../helpers/checkForDuplicates");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateKeyUpdate }    = require('../../../helpers/validateKeyUpdate');
const { validateCreate } = require("../content-types/product/product.validation");

const { createCoreController } = require("@strapi/strapi").factories;

const productFields = {
    fields : ["uuid", "name", "sku", "type", "isDraft"],
    populate : {
        images : {
            fields : ["url"],
        },
        category : {
            fields : ["uuid", "name", "icon", "color"],
        },
        saleInfo : true,
        tags     : true,
    },
};

module.exports = createCoreController( PRODUCT, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
                "sku",
                "description",
            ],
        };

        const products = await findMany( PRODUCT, productFields, filters );

        return products;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( PRODUCT, [
            {
                name : data.name,
            },
            {
                sku : data.sku,
            },
        ]);

        await strapi.service( PRODUCT ).validateParallelData( data );

        const newProduct = await strapi.entityService.create( PRODUCT, {
            data : {
                ...data,
                company : company.id,
            },
        });

        return newProduct;
    },

    async keyUpdate(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateKeyUpdate( data );

        const { id, tags } = await findOneByUuid( uuid, PRODUCT, productFields );

        const entityId = await strapi.service( PRODUCT ).keyFind( data, tags );

        const updatedProduct = await strapi.entityService.update( PRODUCT, id, {
            data : {
                [data.key] : entityId,
            },
            ...productFields
        });

        return updatedProduct;
    },
}));
