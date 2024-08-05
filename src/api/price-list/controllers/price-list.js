const { PRICE_LIST } = require("../../../constants/models");
const checkForDuplicates = require("../../../helpers/checkForDuplicates");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateCreate } = require("../content-types/price-list/price-list.validation");

const { createCoreController } = require("@strapi/strapi").factories;

const listFields = {
    fields   : ["uuid", "name", "discount", "isDefault"],
    populate : {
        customers : {
            count : true,
        },
    }
};

module.exports = createCoreController( PRICE_LIST, ({ strapi }) => ({
    async find(ctx) {
        const { company } = ctx.state;

        const filters = {
            $search : [
                "name",
            ],
        };

        const priceListCount = await strapi.query( PRICE_LIST ).count({
            where : {
                company : ctx.state.company.id,
            },
        });

        if ( priceListCount === 0 ) {
            await strapi.entityService.create( PRICE_LIST, {
                data : {
                    name : "Lista Predeterminada",
                    isDefault : true,
                    discount : 0,
                    company : company.id,
                },
            });
        }

        const priceLists = await findMany( PRICE_LIST, listFields, filters );

        return priceLists;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( PRICE_LIST, [
            {
                name : data.name,
            }
        ]);

        const newPriceList = await strapi.entityService.create( PRICE_LIST, {
            data : {
                ...data,
                company : company.id,
            }
        });

        return newPriceList;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const priceList = await findOneByUuid( uuid, PRICE_LIST );

        await checkForDuplicates( PRICE_LIST, [
            {
                name : data.name,
            }
        ]);

        const updatedPriceList = await strapi.entityService.update( PRICE_LIST, priceList.id, {
            data : {
                ...data
            }
        });

        return updatedPriceList;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const priceList = await findOneByUuid( uuid, PRICE_LIST );

        const deletedPriceList = await strapi.entityService.delete( PRICE_LIST, priceList.id );

        return deletedPriceList;
    }
}));
