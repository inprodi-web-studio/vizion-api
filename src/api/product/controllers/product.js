const { PRODUCT } = require("../../../constants/models");
const checkForDuplicates = require("../../../helpers/checkForDuplicates");
const { validateCreate } = require("../content-types/product/product.validation");

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController( PRODUCT, ({ strapi }) => ({
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
}));
