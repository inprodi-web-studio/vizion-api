const { SALE } = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateCreate } = require("../content-types/sale/sale.validation");

const { createCoreController } = require("@strapi/strapi").factories;

const saleFields = {
    fields : [],
    populate : {}
};

module.exports = createCoreController(SALE, ({ strapi }) => ({
    async find() {
        const query = ctx.query;

        const filters = {
            $search : [
                "fol",
                "customer.finalName",
                "subject"
            ],
        };

        const sales = await findMany( SALE, saleFields, filters );

        if ( query?.stats ) {
            await strapi.service( SALE ).addStats( sales );
        }

        return sales;
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;

        const sale = await findOneByUuid( uuid, SALE, saleFields );

        return sale;
    },

    async create(ctx) {
        const {company} = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await strapi.service( SALE ).validateParallelData( data );

        const fol = await strapi.service( SALE ).generateNextFol( company );

        const newEstimate = await strapi.entityService.create( SALE, {
            data : {
                fol,
                company : company.id,
                ...data,
            },
        });

        return newEstimate;
    },
}));
