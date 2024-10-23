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
        packages : {
            count : true,
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

        data.product = product;

        await strapi.service( PRODUCT_VARIATION ).validateParallelData( data );

        const newVariation = await strapi.entityService.create( PRODUCT_VARIATION, {
            data : {
                ...data,
                ...( data.saleInfo && {
                    saleInfo : {
                        ...data.saleInfo,
                        ...( data.saleInfo?.price && {
                            priceConfig : {
                                type : "fixed",
                            },
                        })
                    },
                }),
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
                saleInfo : {
                    ...data.saleInfo,
                    ...( (!variation.saleInfo?.priceConfig?.type && data.saleInfo?.price ) ? ({
                        priceConfig : {
                            type : "fixed",
                            config : null,
                        }
                    }) : ({
                        priceConfig : variation.saleInfo?.priceConfig
                    })),
                },
                purchaseInfo : {
                    ...data.purchaseInfo,
                },
                stockInfo : {
                    ...data.stockInfo,
                },
                product : product.id,
            },
        });

        return updatedVariation;
    },

    async setPricing(ctx) {
        const data = ctx.request.body;
        const { productUuid, uuid } = ctx.params;

        await validateSetPricing( data );

        const product = await findOneByUuid( productUuid, PRODUCT, {
            populate : {
                saleInfo : true,
            },
        });

        const { id, saleInfo } = await findOneByUuid( uuid, PRODUCT_VARIATION, variationsFields );

        const updatedVariation = await strapi.entityService.update( PRODUCT_VARIATION, id, {
            data : {
                saleInfo : {
                    ...saleInfo,
                    price : saleInfo?.price ? saleInfo.price : product.saleInfo.price,
                    iva : saleInfo?.iva ? saleInfo.iva : product.saleInfo.iva,
                    priceConfig : data,
                },
            },
            ...variationsFields,
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

        const product = await findOneByUuid( productUuid, PRODUCT );
        const variation = await findOneByUuid( uuid, PRODUCT_VARIATION );

        const deletedVariation = await strapi.entityService.delete( PRODUCT_VARIATION, variation.id, variationsFields );

        const variationsCount = await strapi.query( PRODUCT_VARIATION ).count({
            where : {
                product : product.id,
            },
        });

        if ( variationsCount === 0 ) {
            await strapi.entityService.update( PRODUCT, product.id, {
                data : {
                    isDraft : true,
                },
            });
        }

        return deletedVariation;
    },
}));
