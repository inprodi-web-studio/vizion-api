const { CREDIT_MOVEMENT, CUSTOMER } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreController } = require('@strapi/strapi').factories;

const creditMovementsFields = {
    fields   : ["uuid", "policy", "daysToPay", "createdAt"],
    populate : {
        sale : {
            fields : ["uuid", "fol", "subject"],
            populate : {
                resume : true,
            },
        },
        payment : {
            fields : ["uuid", "amount", "date", "fol"],
            populate : {
                sale : {
                    fields : ["uuid", "fol", "subject"],
                    populate : {
                        resume : true,
                    },
                },
            },
        },
    },
};

module.exports = createCoreController(CREDIT_MOVEMENT, ({ strapi }) => ({
    async find(ctx) {
        const {uuid} = ctx.params;

        const customer = await findOneByUuid( uuid, CUSTOMER );

        const movements = await findMany( CREDIT_MOVEMENT, creditMovementsFields, {
            sale : {
                customer : customer.id,
            },
        }, false );

        return movements;
    },
}));
