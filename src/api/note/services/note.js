const { NOTE, LEAD, USER } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const { validateCreate } = require('../content-types/note/note.validation');

const { createCoreService } = require('@strapi/strapi').factories;

const noteFields = {
    fields   : ["uuid", "title", "content"],
    populate : {
        author : {
            fields : ["uuid", "name", "middleName", "lastName"],
        }
    },
};

const relationDictionary = {
    lead : LEAD,
};

module.exports = createCoreService( NOTE, ({ strapi }) => ({
    async getEntityNotes(relation) {
        const ctx      = strapi.requestContext.get();
        const { uuid } = ctx.params;

        const entity = await validateEntityPermission( uuid, relationDictionary[relation] );

        const filters = {
            $search : [
                "title",
                "content"
            ],
            [relation] : entity.id,
        };

        const tasks = await findMany( NOTE, noteFields, filters );

        return tasks;
    },

    async createEntityNote( data ) {
        const ctx         = strapi.requestContext.get();
        const user        = ctx.state.user;
        const { company } = ctx.state;

        await validateCreate( data );

        const entity = await validateEntityPermission( data.entity, relationDictionary[data.relation] );

        const newNote = await strapi.entityService.create( NOTE, {
            data : {
                ...data,
                [data.relation] : entity.id,
                author          : user.id,
                company         : company.id,
            },
            ...noteFields
        });

        return newNote;
    },

    async updateEntityNote( data ) {
        const ctx          = strapi.requestContext.get();
        const { noteUuid } = ctx.params;

        const entity = await validateEntityPermission( data.entity, relationDictionary[data.relation] );
        const note = await findOneByUuid( noteUuid, NOTE );

        const updatedNote = await strapi.entityService.update( NOTE, note.id, {
            data : {
                ...data,
                [data.relation] : entity.id,
            },
            ...noteFields
        });

        return updatedNote;
    },

    async deleteEntityNote(relation) {
        const ctx = strapi.requestContext.get();
        const { uuid, noteUuid } = ctx.params;

        await validateEntityPermission( uuid, relationDictionary[relation] );
        const note = await findOneByUuid( noteUuid, NOTE );

        const deletedNote = await strapi.entityService.delete( NOTE, note.id, noteFields );

        return deletedNote;
    },
}));
