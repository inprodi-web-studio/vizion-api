const { SALE } = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateCreate } = require("../content-types/sale/sale.validation");

const { createCoreController } = require("@strapi/strapi").factories;

const saleFields = {
    fields : ["uuid", "fol", "deliveryDate", "date", "paymentScheme", "subject", "comments", "terms", "creditPolicy", "limitPaymentDate", "isAuthorized"],
    populate : {
        responsible : {
            fields : ["uuid", "name", "middleName", "lastName"],
            populate : {
                image : {
                    fields : ["url"],
                },
            },
        },
        customer : {
            fields : ["uuid", "finalName"],
            populate : {
                credit : true,
                mainAddress : true,
                fiscalInfo : {
                    fields : ["legalName", "rfc", "regime"],
                    populate : {
                        address : true,
                    },
                },
                deliveryAddresses : {
                    fields : ["name", "isMain"],
                    populate : {
                        address : true,
                    },
                },
            },
        },
        deliveryAddress : {
            fields : ["name", "isMain"],
            populate : {
                address : true,
            },
        },
        priceList : {
            fields : ["uuid", "name"],
        },
        items : {
            fields : ["quantity", "price", "iva"],
            populate : {
                product : {
                    fields : ["uuid", "name", "sku", "description"],
                    populate : {
                        images : {
                            fields : ["url"],
                        },
                    },
                },
                discount : true,
            },
        },
        resume : {
            fields : ["subtotal", "individualDiscounts", "taxes", "shipping", "total"],
            populate : {
                globalDiscount : true,
            },
        },
    }
};

module.exports = createCoreController(SALE, ({ strapi }) => ({
    async find(ctx) {
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

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const sale = await findOneByUuid( uuid, SALE, saleFields );

        await strapi.service( SALE ).validateParallelData( data );

        const updatedSale = await strapi.entityService.update( SALE, sale.id, {
            data : {
                ...data,
            },
        });

        return updatedSale;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, SALE );

        const deletedSale = await strapi.entityService.delete( SALE, id );

        return deletedSale;
    },
}));
