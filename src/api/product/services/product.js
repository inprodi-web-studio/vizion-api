const { PRODUCT, PRODUCT_CATEGORY, USER, TAG, PRODUCT_ATTRIBUTE, ATTRIBUTE_VALUE, UNITY, BRAND, PRODUCT_VARIATION } = require("../../../constants/models");
const { BadRequestError } = require("../../../helpers/errors");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService( PRODUCT, ({ strapi }) => ({
    async validateParallelData (data) {
        const { id : unityId } = await findOneByUuid( data.unity, UNITY );

        data.unity = unityId;

        if ( data.category ) {
            const { id : categoryId } = await findOneByUuid( data.category, PRODUCT_CATEGORY );

            data.category = categoryId;
        }

        if ( data.brand ) {
            const { id : brandId } = await findOneByUuid( data.brand, BRAND );

            data.brand = brandId;
        }

        if ( data.stockInfo?.alertTo ) {
            const { id : alertToId } = await findOneByUuid( data.stockInfo.alertTo, USER );

            data.stockInfo.alertTo = alertToId;
        }

        if ( data.attributes ) {
            for ( let i = 0; i < data.attributes.length; i++ ) {
                const { attribute, values } = data.attributes[i];

                const { id : attributeId } = await findOneByUuid( attribute, PRODUCT_ATTRIBUTE );

                data.attributes[i].attribute = attributeId;

                for ( let j = 0; j < values.length; j++ ) {
                    const { id : valueId } = await findOneByUuid( values[j], ATTRIBUTE_VALUE );

                    data.attributes[i].values[j] = valueId;
                }
            }
        }
    },

    async keyFind({ key, value }, tags = []) {
        const ctx = strapi.requestContext.get();

        let entityId;

        switch ( key ) {
            case "category":
                if ( value ) {
                    const { id : categoryId } = await findOneByUuid( value, PRODUCT_CATEGORY );

                    entityId = categoryId;
                } else {
                    entityId = null;
                }
            break;

            case "tags":
                const { id : tagId, uuid, entity } = await findOneByUuid( value, TAG );

                if ( entity !== "product" ) {
                    throw new BadRequestError( `The tag with uuid ${ uuid } is not a product tag`, {
                        key  : "product.invalidTag",
                        path : ctx.request.url,
                    });
                }

                const index = tags.findIndex( t => t.uuid === uuid );

                if ( index === -1 ) {
                    tags.push( tagId );
                } else {
                    tags.splice( index, 1 );
                }

                entityId = tags;
            break;

            default:
                throw new BadRequestError( `The key ${key} is not supported in key update`, {
                    key  : "product.unkownKey",
                    path : ctx.request.url,
                });
        }

        return entityId;
    },

    async validateUpsells(data) {
        const ids = [];

        for ( const item of data ) {
            const { id : productId } = await findOneByUuid( item, PRODUCT );

            ids.push( productId );
        }

        return ids;
    },

    async unpublishVariations(productId) {
        const variations = await strapi.query( PRODUCT_VARIATION ).find({
            where : {
                product : productId,
            },
        });

        const promises = [];

        for ( const variation of variations ) {
            promises.push( strapi.entityService.update( PRODUCT_VARIATION, variation.id, {
                data : {
                    isDraft : true,
                },
            }) );
        }

        await Promise.all( promises );
    },
}));
