const { CUSTOMER_CREDIT, CUSTOMER } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreController } = require('@strapi/strapi').factories;

const creditFields = {
    fields : ["uuid", "createdAt"],
    populate : {
        customer : {
            fields : ["uuid", "finalName", "isArchived"],
        },
        details : true,
    },
};

module.exports = createCoreController(CUSTOMER_CREDIT, ({ strapi }) => ({
    async find(ctx) {
        const { uuid } = ctx.params;

        const customer = await findOneByUuid( uuid, CUSTOMER );

        const history = await findMany( CUSTOMER_CREDIT, creditFields, {
            customer : customer.id,
        });

        return history;
    },
}));
