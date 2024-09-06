const { PRODUCT_VARIATION, PRODUCT, ESTIMATE, SALE } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate, validateUpdate, validateSetPricing } = require('../content-types/product-variation/product-variation.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const variationsFields = {
    fields : ["uuid", "name", "sku", "description"],
    populate : {
        dimensions : true,
        image : {
            fields : ["url"],
        },
        saleInfo : {
            fields : "*",
            populate : {
                priceConfig : true,
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
        values : {
            fields : ["uuid", "name"],
            populate : {
                attribute : true,
            },
        },
    },
};

module.exports = createCoreController(PRODUCT_VARIATION, ({ strapi }) => ({
    async find(ctx) {
        const { productUuid } = ctx.params;
        
        const product = await findOneByUuid( productUuid, PRODUCT );

        const filters = {
            $search : [
                "sku",
                "description",
            ],
            product : product.id,
        };

        const variations = await findMany( PRODUCT_VARIATION, variationsFields, filters );

        return variations;
    },

    async create(ctx) {
        const { productUuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const product = await findOneByUuid( productUuid, PRODUCT, {
            populate : {
                variations : {
                    populate : {
                        value : true,
                    },    
                },
                stockInfo : true,
            },
        });

        await checkForDuplicates( PRODUCT, [
            {
                sku : data.sku,
            },
        ]);

        await strapi.service( PRODUCT_VARIATION ).validateParallelData( data );

        const newVariation = await strapi.entityService.create( PRODUCT_VARIATION, {
            data : {
                ...data,
                saleInfo : {
                    ...data.saleInfo,
                    ...( data.saleInfo && {
                        priceConfig : {
                            type : "fixed",
                        },
                    }),
                },
                stockInfo : {
                    ...data.stockInfo,
                    hasBatches : product.stockInfo?.hasBatches || false,
                    isPerishable : product.stockInfo?.isPerishable || false,
                },
                product : product.id,
            },
        });

        return newVariation;
    },

    async update(ctx) {
        const { productUuid, uuid } = ctx.params;
        const data = ctx.request.body;

        await validateUpdate( data );

        const product = await findOneByUuid( productUuid, PRODUCT, {
            populate : {
                variations : {
                    populate : {
                        value : true,
                    },    
                },
            },
        });

        const variation = await findOneByUuid( uuid, PRODUCT_VARIATION );

        await checkForDuplicates( PRODUCT, [
            {
                sku : data.sku,
            },
        ]);

        await strapi.service( PRODUCT_VARIATION ).validateParallelData( data, variation );

        const updatedVariation = await strapi.entityService.update( PRODUCT_VARIATION, variation.id, {
            data : {
                ...data,
                product : product.id,
            },
        });

        return updatedVariation;
    },

    async setPricing(ctx) {
        const data = ctx.request.body;
        const { productUuid, uuid } = ctx.params;

        await validateSetPricing( data );

        await findOneByUuid( productUuid, PRODUCT );

        const { id, saleInfo } = await findOneByUuid( uuid, PRODUCT_VARIATION );

        const updatedVariation = await strapi.entityService.update( PRODUCT_VARIATION, id, {
            data : {
                saleInfo : {
                    ...saleInfo,
                    priceConfig : data,
                },
            },
        });

        return updatedVariation;
    },

    async findRelations(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, PRODUCT_VARIATION, variationsFields );

        const estimates = await strapi.query( ESTIMATE ).count({
            where : {
                versions : {
                    items : {
                        product : {
                            variations : id,
                        },
                    },
                },
            },
        });

        const sales = await strapi.query( SALE ).count({
            where : {
                items : {
                    product : {
                        variations : id,
                    },
                },
            },
        });

        return {
            estimates,
            sales,
        };
    },

    async delete(ctx) {
        const { productUuid, uuid } = ctx.params;

        await findOneByUuid( productUuid, PRODUCT );
        const variation = await findOneByUuid( uuid, PRODUCT_VARIATION );

        const deletedVariation = await strapi.entityService.delete( PRODUCT_VARIATION, variation.id, variationsFields );

        return deletedVariation;
    },
}));
