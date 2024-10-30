const { CUSTOMER, INSIDER, DOCUMENT, TASK, NOTE, CONTACT_INTERACTION, ESTIMATE, LEAD, CUSTOMER_CREDIT } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findMany = require('../../../helpers/findMany');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const { validateCreate, validateCreateDeliveryAddress, validateCreateCreditLine } = require('../content-types/customer/customer.validation');
const { validateKeyUpdate } = require('../../../helpers/validateKeyUpdate');
const { UnprocessableContentError, ConflictError, NotFoundError, BadRequestError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreController } = require('@strapi/strapi').factories;

const customerFields = {
    fields   : ["uuid", "tradeName", "email", "rating", "isArchived", "value", "finalName", "website", "createdAt"],
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
        credit       : true,
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
        priceList : {
            fields : ["uuid", "name", "discount"]
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

module.exports = createCoreController( CUSTOMER, ({ strapi }) => ({
    async find(ctx) {
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
        };

        const customers = await findMany( CUSTOMER, customerFields, filters );

        return customers;
    },

    async getStats() {
        return await strapi.service( CUSTOMER ).getStats();
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;
        
        const customer = await validateEntityPermission( uuid, CUSTOMER, customerFields );

        return customer;
    },

    async create(ctx) {
        const { company } = ctx.state;
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

        await checkForDuplicates( LEAD, criteria, customerFields );

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
        await strapi.service( CUSTOMER ).generateAddressData(data);

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

       await checkForDuplicates( LEAD, criteria, customerFields );

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

    async createDeliveryAddress(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateCreateDeliveryAddress(data);

        const customer = await findOneByUuid( uuid, CUSTOMER, customerFields );

        const customerAddresses = customer.deliveryAddresses;

        const conflictingAddress = customerAddresses.find( address => address.name === data.name );

        if ( conflictingAddress ) {
            throw new ConflictError( "Delivery address with this name already exists", {
                key : "customer.duplicated_DeliveryAddress",
                path : ctx.request.path,
            });
        }

        if ( data.isMain && customerAddresses.length > 0 ) {
            const index = customerAddresses.findIndex( address => address.isMain );
            customerAddresses[index].isMain = false;
        }

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, customer.id, {
            data : {
                deliveryAddresses : [
                    ...customerAddresses,
                    data,
                ],
            },
            ...customerFields
        });

        return updatedCustomer.deliveryAddresses.find( address => address.name === data.name );
    },

    async updateDeliveryAddress(ctx) {
        const data = ctx.request.body;
        const { uuid, addressId } = ctx.params;

        await validateCreateDeliveryAddress(data);

        const customer = await findOneByUuid( uuid, CUSTOMER, customerFields );

        const customerAddresses = customer.deliveryAddresses;

        const conflictingAddress = customerAddresses.find( address => address.name === data.name );

        if ( conflictingAddress ) {
            throw new ConflictError( "Delivery address with this name already exists", {
                key : "customer.duplicated_DeliveryAddress",
                path : ctx.request.path,
            });
        }

        if ( data.isMain && customerAddresses.length > 0 ) {
            const index = customerAddresses.findIndex( address => address.isMain );
            customerAddresses[index].isMain = false;
        }

        const desiredIndex = customerAddresses.findIndex( address => address.id == addressId );

        customerAddresses[ desiredIndex ] = data;

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, customer.id, {
            data : {
                deliveryAddresses : customerAddresses,
            },
            ...customerFields
        });

        return updatedCustomer.deliveryAddresses.find( address => address.name === data.name );
    },

    async deleteDeliveryAddress(ctx) {
        const { uuid, addressId } = ctx.params;

        const customer = await findOneByUuid( uuid, CUSTOMER, customerFields );

        const customerAddresses = customer.deliveryAddresses;

        const desiredAddress = customerAddresses.find( address => address.id == addressId );

        if ( !desiredAddress ) {
            throw new NotFoundError( "Delivery address not found", {
                key : "customer.notFound_DeliveryAddress",
                path : ctx.request.path,
            });
        }

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, customer.id, {
            data : {
                deliveryAddresses : customerAddresses.filter( address => address.id != addressId ),
            },
            ...customerFields
        });

        return updatedCustomer.deliveryAddresses;
    },

    async createCreditLine(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateCreateCreditLine( data );

        const customer = await findOneByUuid( uuid, CUSTOMER, customerFields );

        if (customer.credit?.id) {
            throw new BadRequestError("The customer already has a credit line configured", {
                key : "customer.existingCreditLine",
                path : ctx.request.path,
            });
        }

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, customer.id, {
            data : {
                credit : {
                    ...data,
                    isActive : true,
                    amountUsed : 0,
                    policy : "on-sale"
                },
            },
            ...customerFields
        });

        await strapi.entityService.create( CUSTOMER_CREDIT, {
            data : {
                customer : updatedCustomer.id,
                details : {
                    ...data,
                    isActive : true,
                    policy : "on-sale",
                },
            },
        });

        return updatedCustomer.credit;
    },

    async updateCreditLine(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateCreateCreditLine( data );

        const customer = await findOneByUuid( uuid, CUSTOMER, customerFields );

        if ( customer.credit.amountUsed > data.amountLimit ) {
            throw new BadRequestError("The amount used can't be less than the new amount limit", {
                key : "customer.invalidNewAmountLimit",
                path : ctx.request.path,
            });
        }

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, customer.id, {
            data : {
                credit : {
                    ...data,
                    isActive : true,
                    amountUsed : customer.credit.amountUsed,
                    policy : "on-sale"
                },
            },
            ...customerFields
        });

        await strapi.entityService.create( CUSTOMER_CREDIT, {
            data : {
                customer : updatedCustomer.id,
                details : {
                    ...data,
                    isActive : true,
                    policy : "on-sale",
                },
            },
        });

        return updatedCustomer.credit;
    },

    async toggleCreditLine(ctx) {
        const { uuid } = ctx.params;

        const customer = await findOneByUuid( uuid, CUSTOMER, customerFields );

        const updatedCustomer = await strapi.entityService.update( CUSTOMER, customer.id, {
            data : {
                credit : {
                    ...customer.credit,
                    isActive : !customer.credit.isActive
                },
            },
            ...customerFields
        });

        await strapi.entityService.create( CUSTOMER_CREDIT, {
            data : {
                customer : updatedCustomer.id,
                details : {
                    ...customer.credit,
                    isActive : !customer.credit.isActive
                },
            },
        });

        return updatedCustomer.credit;
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

        const { id } = await findOneByUuid( uuid, CUSTOMER );

        await strapi.service(CUSTOMER).deleteParallelData(id);

        const deletedCustomer = await strapi.entityService.delete( CUSTOMER, id );

        return deletedCustomer;
    },
}));
