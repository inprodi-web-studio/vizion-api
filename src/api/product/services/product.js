const { PRODUCT, PRODUCT_CATEGORY, USER, TAG } = require("../../../constants/models");
const { BadRequestError } = require("../../../helpers/errors");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService( PRODUCT, ({ strapi }) => ({
    async validateParallelData (data) {
        const ctx = strapi.requestContext.get();

        if ( data.category ) {
            const { id : categoryId } = await findOneByUuid( data.category, PRODUCT_CATEGORY );

            data.category = categoryId;
        }

        if ( data.stockInfo?.alertTo ) {
            const { id : alertToId } = await findOneByUuid( data.stockInfo.alertTo, USER );

            data.stockInfo.alertTo = alertToId;
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
}));
