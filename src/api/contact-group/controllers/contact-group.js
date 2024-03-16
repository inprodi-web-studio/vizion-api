const { CONTACT_GROUP } = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");

const { createCoreController } = require("@strapi/strapi").factories;

const groupFields = {
    fields   : ["uuid", "name", "icon", "color"],
    populate : {
        leads : {
            count : true,
        },
    },
};

module.exports = createCoreController( CONTACT_GROUP, ({ strapi }) => ({
    async find(ctx) {
        const user  = ctx.state.user;
        const query = ctx.query;

        const filters = {
            $search : [
                "name",
            ],
        };

        const groups = await findMany( CONTACT_GROUP, groupFields, filters );

        return groups;
    },
}));
