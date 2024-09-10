const { PRODUCT, ESTIMATE, SALE } = require("../../../constants/models");
const checkForDuplicates = require("../../../helpers/checkForDuplicates");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateKeyUpdate }    = require('../../../helpers/validateKeyUpdate');
const { validateCreate, validateSetPricing, validateSetUpsells, validateUpdate } = require("../content-types/product/product.validation");

const { createCoreController } = require("@strapi/strapi").factories;

const productFields = {
    fields : ["uuid", "name", "sku", "type", "isDraft", "description", "url", "satCode", "taxType"],
    populate : {
        images : {
            fields : ["url", "name", "size", "mime"],
        },
        category : {
            fields : ["uuid", "name", "icon", "color"],
        },
        attributes : {
            populate : {
                attribute : true,
                values    : true,
            },
        },
        unity : {
            fields : ["uuid", "name", "satCode", "abbreviation"],
        },
        dimensions   : true,
        saleInfo     : {
            fields : "*",
            populate : {
                priceConfig : true,
                upsells     : {
                    fields : ["uuid", "name", "sku", "description"],
                    populate : {
                        images : {
                            fields : ["url"],
                        },
                        category : {
                            fields : ["uuid", "name", "icon", "color"],
                        },
                        saleInfo : {
                            fields : "*",
                            populate : {
                                priceConfig : true,
                            }
                        },
                    },
                },
            },
        },
        purchaseInfo : true,
        stockInfo    : {
            fields : "*",
            populate : {
                alertTo : {
                    fields : ["uuid", "name", "middleName", "lastName"],
                    populate : {
                        image : {
                            fields : ["url"],
                        },
                    },
                },
            },
        },
        tags : true,
        variations : {
            count : true,
        },
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

    async findOne(ctx) {
        const { uuid } = ctx.params;

        const product = await findOneByUuid( uuid, PRODUCT, productFields );

        return product;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( PRODUCT, [
            {
                sku : data.sku,
            },
        ]);

        await strapi.service( PRODUCT ).validateParallelData( data );

        const newProduct = await strapi.entityService.create( PRODUCT, {
            data : {
                ...data,
                saleInfo : {
                    ...data.saleInfo,
                    priceConfig : {
                        type : "fixed",
                    },
                },
                company : company.id,
            },
        });

        return newProduct;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateUpdate( data );

        const product = await findOneByUuid( uuid, PRODUCT, productFields );

        await checkForDuplicates( PRODUCT, [
            {
                name : data.name,
            },
            {
                sku : data.sku,
            },
        ]);

        await strapi.service( PRODUCT ).validateParallelData( data );

        const updatedProduct = await strapi.entityService.update( PRODUCT, product.id, {
            data : {
                ...data,
                saleInfo : {
                    ...data.saleInfo,
                    priceConfig : product.saleInfo.priceConfig,
                },
            },
            ...productFields
        });

        return updatedProduct;
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

    async setPricing(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateSetPricing( data );

        const { id, saleInfo } = await findOneByUuid( uuid, PRODUCT, productFields );

        const updatedProduct = await strapi.entityService.update( PRODUCT, id, {
            data : {
                saleInfo : {
                    ...saleInfo,
                    priceConfig : data,
                }
            },
            ...productFields,
        });

        return updatedProduct;
    },

    async setUpsells(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateSetUpsells( data );

        const { id, saleInfo } = await findOneByUuid( uuid, PRODUCT, productFields );

        const upsells = await strapi.service( PRODUCT ).validateUpsells( data );

        const updatedProduct = await strapi.entityService.update( PRODUCT, id, {
            data : {
                saleInfo : {
                    ...saleInfo,
                    upsells,
                }
            },
            ...productFields,
        });

        return updatedProduct;
    },

    async toggleStatus(ctx) {
        const { uuid } = ctx.params;

        const { id, isDraft } = await findOneByUuid( uuid, PRODUCT, productFields );

        const updatedProduct = await strapi.entityService.update( PRODUCT, id, {
            data : {
                isDraft : !isDraft,
            },
            ...productFields
        });

        return updatedProduct;
    },

    async findEstimatesAndSales(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, PRODUCT, productFields );

        const estimates = await strapi.query( ESTIMATE ).count({
            where : {
                versions : {
                    items : {
                        product : id,
                    },
                },
            },
        });

        const sales = await strapi.query( SALE ).count({
            where : {
                items : {
                    product : id,
                },
            },
        });

        return {
            estimates,
            sales,
        };
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, PRODUCT, productFields );

        const deletedProduct = await strapi.entityService.delete( PRODUCT, id, productFields );

        return deletedProduct;
    },
}));
