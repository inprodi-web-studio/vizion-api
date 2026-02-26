const {
    PRODUCT,
    PRODUCT_CATEGORY,
    USER,
    TAG,
    PRODUCT_ATTRIBUTE,
    ATTRIBUTE_VALUE,
    UNITY,
    BRAND,
    PRODUCT_VARIATION,
    PRODUCT_FAMILY,
} = require("../../../constants/models");
const { BadRequestError } = require("../../../helpers/errors");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService( PRODUCT, ({ strapi }) => ({
    async validateParallelData (data, currentProduct = null) {
        const ctx = strapi.requestContext.get();

        const hasUnity = Object.prototype.hasOwnProperty.call(data, "unity");
        const hasCategory = Object.prototype.hasOwnProperty.call(data, "category");
        const hasBrand = Object.prototype.hasOwnProperty.call(data, "brand");
        const hasFamily = Object.prototype.hasOwnProperty.call(data, "family");
        const hasSubfamily = Object.prototype.hasOwnProperty.call(data, "subfamily");

        if (hasUnity) {
            const { id : unityId } = await findOneByUuid( data.unity, UNITY );

            data.unity = unityId;
        }

        if ( hasCategory ) {
            if (data.category) {
                const { id : categoryId } = await findOneByUuid( data.category, PRODUCT_CATEGORY );

                data.category = categoryId;
            } else {
                data.category = null;
            }
        }

        if ( hasBrand ) {
            if (data.brand) {
                const { id : brandId } = await findOneByUuid( data.brand, BRAND );

                data.brand = brandId;
            } else {
                data.brand = null;
            }
        }

        const familySchema = {
            fields : ["uuid", "name"],
            populate : {
                parentId : {
                    fields : ["uuid", "name"],
                },
            },
        };

        const previousFamilyUuid = currentProduct?.family?.uuid ?? null;
        const previousSubfamilyUuid = currentProduct?.subfamily?.uuid ?? null;
        const familyWasChanged = hasFamily && (data.family ?? null) !== previousFamilyUuid;

        const familyUuid = hasFamily
            ? data.family
            : previousFamilyUuid;

        const subfamilyUuid = hasSubfamily
            ? data.subfamily
            : ( familyWasChanged ? null : previousSubfamilyUuid );

        let family = null;
        let subfamily = null;

        if (familyUuid) {
            family = await findOneByUuid( familyUuid, PRODUCT_FAMILY, familySchema );

            if (family.parentId) {
                throw new BadRequestError("The family must be a top-level family", {
                    key  : "product.invalidFamily",
                    path : ctx.request.url,
                });
            }
        }

        if (subfamilyUuid) {
            subfamily = await findOneByUuid( subfamilyUuid, PRODUCT_FAMILY, familySchema );

            if (!subfamily.parentId) {
                throw new BadRequestError("The subfamily must belong to a family", {
                    key  : "product.invalidSubfamily",
                    path : ctx.request.url,
                });
            }
        }

        if (hasFamily && data.family === null && subfamily) {
            throw new BadRequestError("A family is required when subfamily is provided", {
                key  : "product.invalidSubfamily",
                path : ctx.request.url,
            });
        }

        if (subfamily) {
            if (!family) {
                family = subfamily.parentId;
            } else if (subfamily.parentId.id !== family.id) {
                throw new BadRequestError("Subfamily does not belong to the provided family", {
                    key  : "product.invalidSubfamilyFamilyRelation",
                    path : ctx.request.url,
                });
            }
        }

        if (hasFamily || (hasSubfamily && family)) {
            data.family = family ? family.id : null;
        }

        if (hasSubfamily || familyWasChanged || (hasFamily && data.family === null)) {
            data.subfamily = subfamily ? subfamily.id : null;
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
        const variations = await strapi.query( PRODUCT_VARIATION ).findMany({
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
