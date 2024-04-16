const { TASK, LEAD, USER } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const { validateCreate } = require('../content-types/task/task.validation');

const { createCoreService } = require('@strapi/strapi').factories;

const taskFields = {
    fields : ["uuid", "title", "description", "dueDate", "reminders", "isCompleted", "completedAt"],
    populate : {
        lead : {
            fields : ["uuid"],
        },
        responsible : {
            fields : ["uuid", "name", "middleName", "lastName", "email"],
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

        const entity = await validateEntityPermission( uuid, relationDictionary[relation] );

        const filters = {
            $search : [
                "title",
                "description"
            ],
            [relation] : entity.id,
        };

        const tasks = await findMany( TASK, taskFields, filters );

        return tasks;
    },

    async createEntityTask( data ) {
        const ctx         = strapi.requestContext.get();
        const { company } = ctx.state;

        await validateCreate( data );

        const entity = await validateEntityPermission( data.entity, relationDictionary[data.relation] );

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

        await strapi.service( TASK ).scheduleReminders( newTask );

        return newTask;
    },

    async updateEntityTask( data ) {
        const ctx          = strapi.requestContext.get();
        const { taskUuid } = ctx.params;

        const entity = await validateEntityPermission( data.entity, relationDictionary[data.relation] );

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

    async toggleEntityTask( data ) {
        const ctx = strapi.requestContext.get();
        const { taskUuid } = ctx.params;

        await validateEntityPermission( data.entity, relationDictionary[data.relation] );

        const task = await findOneByUuid( taskUuid, TASK );

        const updatedTask = await strapi.entityService.update( TASK, task.id, {
            data : {
                isCompleted  : !task.completedAt,
                completedAt  : task.isCompleted ? null : new Date(),
            },
            ...taskFields
        });

        return updatedTask;
    },

    async deleteEntityTask(relation) {
        const ctx = strapi.requestContext.get();
        const { uuid, taskUuid } = ctx.params;

        await validateEntityPermission( uuid, relationDictionary[relation] );
        const task = await findOneByUuid( taskUuid, TASK );

        const deletedTask = await strapi.entityService.delete( TASK, task.id, taskFields );

        return deletedTask;
    },

    async scheduleReminders({ uuid, reminders }) {
        for ( let i = 0; i < reminders.length; i++ ) {
            const reminder = reminders[i];

            await strapi.cron.add({
                [`send-reminder-${ uuid }-${ i }`] : {
                    task : async ({ strapi }) => {
                        const task = await findOneByUuid( uuid, TASK, taskFields );

                        if ( task.isCompleted ) {
                           return;
                        }

                        const emailConfig = {
                            subject : `[Recordatorio] - ${ task.title }`,
                            text    : `Tienes un nuevo correo de Recordatorio - ${ task.title }`,
                            html    : `<p></p>`,
                        };

                        await strapi.plugins["email"].services.email.sendTemplatedEmail(
                            {
                                to : task.responsible.email,
                            },
                            emailConfig,
                            {}
                        );
                    },
                    options : reminder,
                },
            });
        }
    },
}));
