const { ADJUSTMENT_MOTIVE } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');

const { createCoreController } = require('@strapi/strapi').factories;

const motiveFields = {
    fields : ["uuid", "title"],
};

module.exports = createCoreController(ADJUSTMENT_MOTIVE, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "title",
            ]
        };

        const motives = await findMany( ADJUSTMENT_MOTIVE, motiveFields, filters );

        return motives;
    },
}));
