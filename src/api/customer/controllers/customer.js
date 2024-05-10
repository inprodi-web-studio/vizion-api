const { CUSTOMER, INSIDER, DOCUMENT, TASK, NOTE, CONTACT_INTERACTION } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findMany = require('../../../helpers/findMany');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const { validateCreate } = require('../content-types/customer/customer.validation');
const { validateKeyUpdate } = require('../../../helpers/validateKeyUpdate');
const { UnprocessableContentError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreController } = require('@strapi/strapi').factories;

const customerFields = {
    fields   : ["uuid", "tradeName", "email", "rating", "isArchived", "value", "finalName", "createdAt"],
    populate : {
        completeName : true,
        phone        : true,
        cellphone    : true,
        mainAddress  : true,
        fiscalInfo   : {
            fields : ["rfc", "legalName", "regime"],
            populate : {
                address : true,
            }
        },
        customerMeta : true,
        group        : true,
        source       : true,
        tags         : true,
        insiders     : {
            fields : ["uuid", "email", "isPrimary", "job"],
            populate : {
                completeName : true,
                phone        : true,
            },
        },
        responsible  : {
            fields : ["uuid", "name", "middleName", "lastName"],
            populate : {
                image : {
                    fields : ["url"],
                },
            },
        },
    },
};

module.exports = createCoreController( CUSTOMER, ({ strapi }) => ({
    async find(ctx) {
        const user  = ctx.state.user;
        const query = ctx.query;

        const filters = {
            $search : [
                "email",
                "tradeName",
                "phone.number",
                "fiscalInfo.rfc",
                "completeName.name",
                "fiscalInfo.legalName",
                "completeName.lastName",
                "completeName.middleName",
            ],
            ...( user.role.name !== "owner" && {
                responsible : user.id,
            }),
        };

        const customers = await findMany( CUSTOMER, customerFields, filters );

        if ( query?.stats ) {
            await strapi.service( CUSTOMER ).addStats( customers );
        }

        return customers;
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;
        
        const customer = await validateEntityPermission( uuid, CUSTOMER, customerFields );

        // await strapi.service( CUSTOMER ).getActivityStats( customer );

        return customer;
    },

    async create(ctx) {
        const { user, company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        if ( user.role.name !== "owner" ) {
            data.responsible = user.id;
        }

        const criteria = [];

        if ( data.email ) {
            criteria.push({
                email : data.email,
            });
        }

        if ( data.phone?.number ) {
            criteria.push({
                phone : {
                    code   : data.phone?.code,
                    number : data.phone?.number,
                },
            });
        }

        if ( data.cellphone?.number ) {
            criteria.push({
                cellphone : {
                    code   : data.cellphone?.code,
                    number : data.cellphone?.number,
                },
            });
        }

        if ( data.fiscalInfo?.rfc ) {
            criteria.push({
                fiscalInfo : {
                    rfc : data.fiscalInfo?.rfc
                },
            });
        }

        if ( data.fiscalInfo?.legalName ) {
            criteria.push({
                fiscalInfo : {
                    legalName : data.fiscalInfo?.legalName
                },
            });
        }

        await checkForDuplicates( CUSTOMER, criteria, customerFields );

        await strapi.service( CUSTOMER ).validateParallelData( data );

        const newCustomer = await strapi.entityService.create( CUSTOMER, {
            data : {
                ...data,
                value      : 0,
                isArchived : false,
                company    : company.id,
                finalName  : data.tradeName ? data.tradeName : `${ data.completeName.name }${ data.completeName.middleName ? ` ${ data.completeName.middleName }` : "" } ${ data.completeName.lastName ? data.completeName.lastName : "" }`,
            },
            ...customerFields,
        });

        return newCustomer;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

       const customer = await validateEntityPermission( uuid, CUSTOMER, customerFields );

       const criteria = [];

       if ( data.email ) {
           criteria.push({
               email : data.email,
           });
       }

       if ( data.phone?.number ) {
           criteria.push({
               phone : {
                   code   : data.phone?.code,
                   number : data.phone?.number,
               },
           });
       }

       if ( data.cellphone?.number ) {
           criteria.push({
               cellphone : {
                   code   : data.cellphone?.code,
                   number : data.cellphone?.number,
               },
           });
       }

       if ( data.fiscalInfo?.rfc ) {
           criteria.push({
               fiscalInfo : {
                   rfc : data.fiscalInfo?.rfc
               },
           });
       }

       if ( data.fiscalInfo?.legalName ) {
           criteria.push({
               fiscalInfo : {
                   legalName : data.fiscalInfo?.legalName
               },
           });
       }

       await checkForDuplicates( CUSTOMER, criteria, customerFields );

        await strapi.service( CUSTOMER ).validateParallelData( data );

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, customer.id, {
            data : {
                ...data,
                finalName : data.tradeName ? data.tradeName : `${ data.completeName.name }${ data.completeName.middleName ? ` ${ data.completeName.middleName }` : "" } ${ data.completeName.lastName ? data.completeName.lastName : "" }`,
            },
            ...customerFields,
        });

        return updatedCustomer;
    },

    async keyUpdate(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        await validateKeyUpdate( data );

        const { id, tags } = await validateEntityPermission( uuid, CUSTOMER, customerFields );

        const entityId = await strapi.service( CUSTOMER ).keyFind( data, tags );

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, id, {
            data : {
                [data.key] : entityId,
            },
            ...customerFields
        });

        return updatedCustomer;
    },

    async toggleStatus(ctx) {
        const { uuid } = ctx.params;

        const { id, isArchived } = await validateEntityPermission( uuid, CUSTOMER );

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, id, {
            data : {
                isArchived : !isArchived,
            },
            ...customerFields
        });

        return updatedCustomer;
    },

    async getInsiders(ctx) {
        const insiders = await strapi.service( INSIDER ).getEntityInsiders( "customer" );

        return insiders;
    },

    async createInsider(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "customer";
        data.entity   = uuid;

        const newInsider = await strapi.service( INSIDER ).createEntityInsider( data );

        return newInsider;
    },

    async updateInsider(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "customer";
        data.entity   = uuid;

        const updatedInsider = await strapi.service( INSIDER ).updateEntityInsider( data );

        return updatedInsider;
    },

    async deleteInsider(ctx) {
        const deletedInsider = await strapi.service( INSIDER ).deleteEntityInsider( "customer" );

        return deletedInsider;
    },

    async getFiles(ctx) {
        const { uuid }   = ctx.params;
        const { search } = ctx.query ?? {};
        
        const customer = await validateEntityPermission( uuid, CUSTOMER, {
            populate : {
                documents : {
                    fields   : ["uuid"],
                    populate : {
                        user : {
                            fields   : ["name, middleName, lastName"],
                            populate : {
                                image : {
                                    fields : ["url"],
                                },
                            },
                        },
                        file : true,
                    },
                },
            },
        });

        return search ? customer.documents.filter( doc => doc.file.name.toLowerCase().includes( search.toLowerCase() ) ) : customer.documents ?? [];
    },

    async uploadFile(ctx) {
        const { user } = ctx.state;
        const { uuid } = ctx.params;
        const { file } = ctx.request.files ?? {};

        if ( !file ) {
            throw new UnprocessableContentError(["File is required"]);
        }

        const customer = await validateEntityPermission( uuid, CUSTOMER, customerFields );

        const newDocument = await strapi.entityService.create( DOCUMENT, {
            data : {
                user : user.id,
            },
        });

        await strapi.plugins.upload.services.upload.uploadToEntity({
            id    : newDocument.id,
            model : DOCUMENT,
            field : "file",
        }, file );

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, customer.id, {
            data : {
                documents : {
                    connect : [ newDocument.id ],
                },
            },
            fields : ["uuid"],
            populate : {
                documents : {
                    fields : ["uuid"],
                    populate : {
                        user : {
                            fields   : ["name, middleName, lastName"],
                            populate : {
                                image : {
                                    fields : ["url"],
                                },
                            },
                        },
                        file : true,
                    }
                },
            }
        });

        return updatedCustomer;
    },

    async removeFile(ctx) {
        const { uuid, documentUuid } = ctx.params;

        await validateEntityPermission( uuid, CUSTOMER );

        const { id, file } = await findOneByUuid( documentUuid, DOCUMENT, {
            populate : {
                file : true,
            },
        });

        await strapi.plugins.upload.services.upload.remove( file );

        const deletedDocument = await strapi.entityService.delete( DOCUMENT, id, {
            fields : ["uuid"],
        });

        return deletedDocument;
    },

    async getTasks(ctx) {
        const tasks = await strapi.service( TASK ).getEntityTasks( "customer" );

        return tasks;
    },

    async createTask(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "customer";
        data.entity   = uuid;

        const newTask = await strapi.service( TASK ).createEntityTask( data );

        return newTask;
    },

    async updateTask(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "customer";
        data.entity   = uuid;

        const updatedTask = await strapi.service( TASK ).updateEntityTask( data );

        return updatedTask;
    },

    async toggleTask(ctx) {
        const { uuid } = ctx.params;

        const data = {
            relation : "customer",
            entity   : uuid,
        };

        const updatedTask = await strapi.service( TASK ).toggleEntityTask( data );

        return updatedTask;
    },

    async deleteTask(ctx) {
        const deletedTask = await strapi.service( TASK ).deleteEntityTask( "customer" );

        return deletedTask;
    },

    async getNotes(ctx) {
        const notes = await strapi.service( NOTE ).getEntityNotes( "customer" );

        return notes;
    },

    async createNote(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "customer";
        data.entity   = uuid;

        const newNote = await strapi.service( NOTE ).createEntityNote( data );

        return newNote;
    },

    async updateNote(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "customer";
        data.entity   = uuid;

        const updatedNote = await strapi.service( NOTE ).updateEntityNote( data );

        return updatedNote;
    },

    async deleteNote(ctx) {
        const deletedNote = await strapi.service( NOTE ).deleteEntityNote( "customer" );

        return deletedNote;
    },

    async getInteractions(ctx) {
        const interactions = await strapi.service( CONTACT_INTERACTION ).getEntityInteractions( "customer" );

        return interactions;
    },

    async createInteraction(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "customer";
        data.entity   = uuid;

        const newInteraction = await strapi.service( CONTACT_INTERACTION ).createEntityInteraction( data );

        return newInteraction;
    },

    async deleteInteraction(ctx) {
        const deletedInteraction = await strapi.service( CONTACT_INTERACTION ).deleteEntityInteraction( "customer" );

        return deletedInteraction;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await validateEntityPermission( uuid, CUSTOMER );

        const deletedCustomer = await strapi.entityService.delete( CUSTOMER, id );

        return deletedCustomer;
    },
}));
