const { TASK, LEAD, USER } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const { validateCreate } = require('../content-types/task/task.validation');

const { createCoreService } = require('@strapi/strapi').factories;

const taskFields = {
    fields : ["uuid", "title", "description", "dueDate"],
    populate : {
        lead : {
            fields : ["uuid"],
        },
    },
};

const relationDictionary = {
    lead : LEAD,
};

module.exports = createCoreService( TASK, ({ strapi }) => ({
    async getEntityTasks(relation) {
        const ctx      = strapi.requestContext.get();
        const { uuid } = ctx.params;

        const entity = await findOneByUuid( uuid, relationDictionary[relation] );

        const tasks = await findMany( TASK, taskFields, {
            [relation] : entity.id,
        });

        return tasks;
    },

    async createEntityTask( data ) {
        const ctx         = strapi.requestContext.get();
        const { company } = ctx.state;

        await validateCreate( data );

        const entity = await findOneByUuid( data.entity, relationDictionary[data.relation] );

        const responsible = await findOneByUuid( data.responsible, USER );

        const newTask = await strapi.entityService.create( TASK, {
            data : {
                ...data,
                [data.relation] : entity.id,
                responsible     : responsible.id,
                reminders       : data.reminders || [],
                company         : company.id,
            },
            ...taskFields
        });

        return newTask;
    },

    async updateEntityTask( data ) {
        const ctx          = strapi.requestContext.get();
        const { taskUuid } = ctx.params;

        const entity = await findOneByUuid( data.entity, relationDictionary[data.relation] );

        const responsible = await findOneByUuid( data.responsible, USER );

        const task = await findOneByUuid( taskUuid, TASK );

        const updatedTask = await strapi.entityService.update( TASK, task.id, {
            data : {
                ...data,
                [data.relation] : entity.id,
                responsible     : responsible.id,
                reminders       : data.reminders,
            },
            ...taskFields
        });

        return updatedTask;
    },

    async deleteEntityTask(relation) {
        const ctx = strapi.requestContext.get();
        const { uuid, taskUuid } = ctx.params;

        await findOneByUuid( uuid, relationDictionary[relation] );
        const task = await findOneByUuid( taskUuid, TASK );

        const deletedTask = await strapi.entityService.delete( TASK, task.id, taskFields );

        return deletedTask;
    },
}));
