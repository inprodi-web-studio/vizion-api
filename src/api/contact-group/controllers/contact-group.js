const { CONTACT_GROUP }  = require("../../../constants/models");
const checkForDuplicates = require("../../../helpers/checkForDuplicates");
const findMany           = require("../../../helpers/findMany");
const findOneByUuid      = require("../../../helpers/findOneByUuid");
const { validateCreate } = require("../content-types/contact-group/contact-group.validation");

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
        const filters = {
            $search : [
                "name",
            ],
        };

        const groups = await findMany( CONTACT_GROUP, groupFields, filters );

        return groups;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( CONTACT_GROUP, [
            {
                name : data.name,
            },
        ]);

        const newGroup = await strapi.entityService.create( CONTACT_GROUP, {
            data : {
                ...data,
                company : company.id,
            },
            ...groupFields
        });

        return newGroup;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const group = await findOneByUuid( uuid, CONTACT_GROUP );

        await checkForDuplicates( CONTACT_GROUP, [
            {
                name : data.name,
            }
        ]);

        const updatedGroup = await strapi.entityService.update( CONTACT_GROUP, group.id, {
            data : {
                ...data,
            },
            ...groupFields
        });

        return updatedGroup;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const group = await findOneByUuid( uuid, CONTACT_GROUP );

        const deletedGroup = await strapi.entityService.delete( CONTACT_GROUP, group.id, groupFields );

        return deletedGroup;
    },
}));