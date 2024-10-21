const { LEAD, DOCUMENT, TASK, NOTE, CONTACT_INTERACTION, INSIDER, CUSTOMER, ESTIMATE } = require('../../../constants/models');
const findMany                 = require('../../../helpers/findMany');
const { validateCreate, validateCreateDeliveryAddress }       = require('../content-types/lead/lead.validation');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const checkForDuplicates       = require('../../../helpers/checkForDuplicates');
const { validateKeyUpdate }    = require('../../../helpers/validateKeyUpdate');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { UnprocessableContentError, ConflictError } = require('../../../helpers/errors');
const dayjs = require('dayjs');

const { createCoreController } = require('@strapi/strapi').factories;

const leadFields = {
    fields   : ["uuid", "tradeName", "finalName", "email", "website", "rating", "isActive", "value", "potential", "createdAt"],
    populate : {
        estimates : {
            count : true,
        },
        completeName : true,
        phone        : true,
        cellphone    : true,
        mainAddress  : true,
        fiscalInfo   : true,
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
        deliveryAddresses : {
            fields : ["name", "references", "isMain"],
            populate : {
                address : true,
            },
        },
    },
};

module.exports = createCoreController( LEAD, ({ strapi }) => ({
    async find(ctx) {
        const user  = ctx.state.user;

        const filters = {
            $search : [
                "email",
                "tradeName",
                "phone.number",
                "completeName.name",
                "completeName.lastName",
                "completeName.middleName",
            ],
        };

        const leads = await findMany( LEAD, leadFields, filters );

        return leads;
    },

    async getStats() {
        return await strapi.service( LEAD ).getStats();
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;
        
        const lead = await validateEntityPermission( uuid, LEAD, leadFields );

        await strapi.service( LEAD ).getActivityStats( lead );

        return lead;
    },

    async create(ctx) {
        const { user, company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

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

        await checkForDuplicates( LEAD, criteria, leadFields );
        await checkForDuplicates( CUSTOMER, criteria, leadFields );

        await strapi.service( LEAD ).validateParallelData( data );

        const newLead = await strapi.entityService.create( LEAD, {
            data : {
                ...data,
                company   : company.id,
                value     : 0,
                potential : 0,
                finalName : data.tradeName ? data.tradeName : `${ data.completeName.name }${ data.completeName.middleName ? ` ${ data.completeName.middleName }` : "" } ${ data.completeName.lastName ? data.completeName.lastName : "" }`,
            },
            ...leadFields,
        });

        return newLead;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const lead = await validateEntityPermission( uuid, LEAD, leadFields );

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

        await checkForDuplicates( LEAD, criteria, leadFields );
        await checkForDuplicates( CUSTOMER, criteria, leadFields );

        await strapi.service( LEAD ).validateParallelData( data );

        const updatedLead = await strapi.entityService.update( LEAD, lead.id, {
            data : {
                ...data,
                finalName : data.tradeName ? data.tradeName : `${ data.completeName.name }${ data.completeName.middleName ? ` ${ data.completeName.middleName }` : "" } ${ data.completeName.lastName ? data.completeName.lastName : "" }`,
            },
            ...leadFields,
        });

        return updatedLead;
    },
    
    async keyUpdate(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        await validateKeyUpdate( data );

        const { id, tags } = await validateEntityPermission( uuid, LEAD, leadFields );

        const entityId = await strapi.service( LEAD ).keyFind( data, tags );

        const updatedLead = await strapi.entityService.update( LEAD, id, {
            data : {
                [data.key] : entityId,
            },
            ...leadFields
        });

        return updatedLead;
    },

    async toggleStatus(ctx) {
        const { uuid } = ctx.params;

        const { id, isActive } = await validateEntityPermission( uuid, LEAD );

        const updatedLead = await strapi.entityService.update( LEAD, id, {
            data : {
                isActive : !isActive,
            },
            ...leadFields
        });

        return updatedLead;
    },

    async convert(ctx) {
        const { uuid } = ctx.params;
        const data    = ctx.request.body;
        const company = ctx.state.company;

        const lead = await strapi.service( LEAD ).prepareLeadData( uuid, data );

        const newCustomer = await strapi.service( LEAD ).convertLeadToCustomer( lead, company );

        await strapi.entityService.delete( LEAD, lead.id );

        return newCustomer;
    },

    async getInsiders(ctx) {
        const insiders = await strapi.service( INSIDER ).getEntityInsiders( "lead" );

        return insiders;
    },

    async createInsider(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "lead";
        data.entity   = uuid;

        const newInsider = await strapi.service( INSIDER ).createEntityInsider( data );

        return newInsider;
    },

    async updateInsider(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "lead";
        data.entity   = uuid;

        const updatedInsider = await strapi.service( INSIDER ).updateEntityInsider( data );

        return updatedInsider;
    },

    async setPrimaryInsider(ctx) {
        const updatedInsider = await strapi.service( INSIDER ).setPrimary( "lead" );

        return updatedInsider;
    },

    async deleteInsider(ctx) {
        const deletedInsider = await strapi.service( INSIDER ).deleteEntityInsider( "lead" );

        return deletedInsider;
    },

    async createDeliveryAddress(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateCreateDeliveryAddress(data);

        const lead = await findOneByUuid( uuid, LEAD, leadFields );

        const leadAddresses = lead.deliveryAddresses;

        const conflictingAddress = leadAddresses.find( address => address.name === data.name );

        if ( conflictingAddress ) {
            throw new ConflictError( "Delivery address with this name already exists", {
                key : "lead.duplicated_DeliveryAddress",
                path : ctx.request.path,
            });
        }

        if ( data.isMain && leadAddresses.length > 0 ) {
            const index = leadAddresses.findIndex( address => address.isMain );
            leadAddresses[index].isMain = false;
        }

        const updatedLead = await strapi.entityService.update( LEAD, lead.id, {
            data : {
                deliveryAddresses : [
                    ...leadAddresses,
                    data,
                ],
            },
            ...leadFields
        });

        return updatedLead.deliveryAddresses.find( address => address.name === data.name );
    },

    async getFiles(ctx) {
        const { uuid }   = ctx.params;
        const { search } = ctx.query ?? {};
        
        const lead = await validateEntityPermission( uuid, LEAD, {
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

        return search ? lead.documents.filter( doc => doc.file.name.toLowerCase().includes( search.toLowerCase() ) ) : lead.documents ?? [];
    },

    async uploadFile(ctx) {
        const { user } = ctx.state;
        const { uuid } = ctx.params;
        const { file } = ctx.request.files ?? {};

        if ( !file ) {
            throw new UnprocessableContentError(["File is required"]);
        }

        const lead = await validateEntityPermission( uuid, LEAD, leadFields );

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

        const updatedLead = await strapi.entityService.update( LEAD, lead.id, {
            data : {
                documents : {
                    connect : [ newDocument.id ],
                },
            },
            fields   : ["uuid"],
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

        return updatedLead;
    },

    async removeFile(ctx) {
        const { uuid, documentUuid } = ctx.params;

        await validateEntityPermission( uuid, LEAD );

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
        const tasks = await strapi.service( TASK ).getEntityTasks( "lead" );

        return tasks;
    },

    async createTask(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "lead";
        data.entity   = uuid;

        const newTask = await strapi.service( TASK ).createEntityTask( data );

        return newTask;
    },

    async updateTask(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "lead";
        data.entity   = uuid;

        const updatedTask = await strapi.service( TASK ).updateEntityTask( data );

        return updatedTask;
    },

    async toggleTask(ctx) {
        const { uuid } = ctx.params;

        const data = {
            relation : "lead",
            entity   : uuid,
        };

        const toggleTask = await strapi.service( TASK ).toggleEntityTask( data );

        return toggleTask;
    },

    async deleteTask(ctx) {
        const deletedTask = await strapi.service( TASK ).deleteEntityTask( "lead" );

        return deletedTask;
    },

    async getNotes(ctx) {
        const notes = await strapi.service( NOTE ).getEntityNotes( "lead" );

        return notes;
    },

    async createNote(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "lead";
        data.entity   = uuid;

        const newNote = await strapi.service( NOTE ).createEntityNote( data );

        return newNote;
    },

    async updateNote(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "lead";
        data.entity   = uuid;

        const updateNote = await strapi.service( NOTE ).updateEntityNote( data );

        return updateNote;
    },

    async deleteNote(ctx) {
        const deletedNote = await strapi.service( NOTE ).deleteEntityNote( "lead" );

        return deletedNote;
    },

    async getInteractions(ctx) {
        const interactions = await strapi.service( CONTACT_INTERACTION ).getEntityInteractions( "lead" );

        return interactions;
    },

    async createInteraction(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        data.relation = "lead";
        data.entity   = uuid;

        const newInteraction = await strapi.service( CONTACT_INTERACTION ).createEntityInteraction( data );

        return newInteraction;
    },

    async deleteInteraction(ctx) {
        const deletedInteraction = await strapi.service( CONTACT_INTERACTION ).deleteEntityInteraction( "lead" );

        return deletedInteraction;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, LEAD );

        await strapi.service(LEAD).deleteParallelData(id);

        const deletedLead = await strapi.entityService.delete( LEAD, id );

        return deletedLead;
    },
}));