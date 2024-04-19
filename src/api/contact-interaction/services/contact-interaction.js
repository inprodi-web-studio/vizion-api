const { CONTACT_INTERACTION, LEAD, CUSTOMER } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const { validateCreate } = require('../content-types/contact-interaction/contact-interaction.validation');

const { createCoreService } = require('@strapi/strapi').factories;

const interactionFields = {
    fields   : ["uuid", "type", "content", "createdAt"],
    populate : {
        user : {
            fields : ["uuid", "name", "middleName", "lastName"],
        }
    },
};

const relationDictionary = {
    lead     : LEAD,
    customer : CUSTOMER,
};

module.exports = createCoreService(CONTACT_INTERACTION, ({ strapi }) => ({
    async getEntityInteractions(relation) {
        const ctx      = strapi.requestContext.get();
        const { uuid } = ctx.params;

        const entity = await validateEntityPermission( uuid, relationDictionary[relation] );

        const filters = {
            $search : [
                "content"
            ],
            [relation] : entity.id,
        };

        const tasks = await findMany( CONTACT_INTERACTION, interactionFields, filters );

        return tasks;
    },

    async createEntityInteraction( data ) {
        const ctx         = strapi.requestContext.get();
        const user        = ctx.state.user;
        const { company } = ctx.state;

        await validateCreate( data );

        const entity = await validateEntityPermission( data.entity, relationDictionary[data.relation] );

        const newInteraction = await strapi.entityService.create( CONTACT_INTERACTION, {
            data : {
                ...data,
                [data.relation] : entity.id,
                user            : user.id,
                company         : company.id,
            },
            ...interactionFields
        });

        return newInteraction;
    },

    async deleteEntityInteraction(relation) {
        const ctx = strapi.requestContext.get();
        const { uuid, interactionUuid } = ctx.params;

        await validateEntityPermission( uuid, relationDictionary[relation] );
        const interaction = await findOneByUuid( interactionUuid, CONTACT_INTERACTION );

        const deletedInteraction = await strapi.entityService.delete( CONTACT_INTERACTION, interaction.id, interactionFields );

        return deletedInteraction;
    },
}));
