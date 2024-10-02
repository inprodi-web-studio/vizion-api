const { PRODUCT_VARIATION, ATTRIBUTE_VALUE, USER } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const { ConflictError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(PRODUCT_VARIATION, ({ strapi }) => ({
    async validateParallelData( data, variation ) {
        const ctx = strapi.requestContext.get();
        const { company } = ctx.state;
        const method      = ctx.request.method;

        let name = "";

        if ( method === "POST" ) {
            for ( let i = 0; i < data.values.length; i++ ) {
                const { id : valueId, name : valueName } = await findOneByUuid( data.values[i], ATTRIBUTE_VALUE );
    
                data.values[i] = valueId;
    
                if ( name ) {
                    name = `${name} / ${valueName}`;
                } else {
                    name = valueName;
                }
            }

            data.name = name;
        } else {
            name = variation.name;
        }

        if ( data.stockInfo?.alertTo ) {
            const { id : alertToId } = await findOneByUuid( data.stockInfo.alertTo, USER );

            data.stockInfo.alertTo = alertToId;
        }

        const skuConflicting = await strapi.query( PRODUCT_VARIATION ).count({
            where : {
                sku : data.sku,
                product : {
                    company : company.id,
                },
                ...( ctx.request.method === "PUT" && {
                    uuid : {
                        $not : ctx.params.uuid
                    },
                }),
            },
        });

        if ( skuConflicting > 0 ) {
            throw new ConflictError("Variation with sku already exists", {
                key : "product-variation.duplicated_sku",
                path : ctx.request.path,
            });
        }

        const nameConflicting = await strapi.query( PRODUCT_VARIATION ).count({
            where : {
                name,
                product : data.product.id,
                ...( ctx.request.method === "PUT" && {
                    uuid : {
                        $not : ctx.params.uuid
                    },
                }),
            },
        });

        if ( nameConflicting > 0 ) {
            throw new ConflictError("Variation with name already exists", {
                key : "product-variation.duplicated_name",
                path : ctx.request.path,
            });
        }
    },
}));
