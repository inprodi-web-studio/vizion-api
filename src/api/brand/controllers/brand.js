const { BRAND } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');

const { createCoreController } = require('@strapi/strapi').factories;

const brandFields = {
    fields : ["uuid", "name"],
    populate : {
        image : {
            fields : ["url"],
        },
    }
};

module.exports = createCoreController(BRAND, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
            ],
        };

        const categories = await findMany( BRAND, brandFields, filters );

        return categories;
    },
}));
