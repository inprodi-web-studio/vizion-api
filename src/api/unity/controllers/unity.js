const { UNITY } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');

const { createCoreController } = require('@strapi/strapi').factories;

const unityFields = {
    fields : ["uuid", "name", "satCode", "abbreviation"],
};

module.exports = createCoreController( UNITY, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
                "abbreviation",
            ],
        };

        const unities = await findMany( UNITY, unityFields, filters );

        return unities;
    },
}));
