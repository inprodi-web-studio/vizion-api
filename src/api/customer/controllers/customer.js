const { CUSTOMER } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findMany = require('../../../helpers/findMany');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const { validateCreate } = require('../content-types/customer/customer.validation');
const { validateKeyUpdate } = require('../../../helpers/validateKeyUpdate');

const { createCoreController } = require('@strapi/strapi').factories;

const customerFields = {
    fields   : ["uuid", "tradeName", "email", "rating", "isArchived", "value", "createdAt"],
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

        await strapi.service( CUSTOMER ).getActivityStats( customer );

        return customer;
    },

    async create(ctx) {
        const { user, company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        if ( user.role.name !== "owner" ) {
            data.responsible = user.id;
        }

        await checkForDuplicates( CUSTOMER, [
            {
                email : data.email,
            },
            {
                phone : {
                    code   : data.phone?.code,
                    number : data.phone?.number,
                },
            },
            {
                cellphone : {
                    code   : data.cellphone?.code,
                    number : data.cellphone?.number,
                },
            },
            {
                fiscalInfo : {
                    rfc : data.fiscalInfo?.rfc
                },
            },
            {
                fiscalInfo : {
                    legalName : data.fiscalInfo?.legalName
                },
            },
        ], customerFields );

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

        await checkForDuplicates( CUSTOMER, [
            {
                email : data.email,
            },
            {
                phone : {
                    code   : data.phone?.code,
                    number : data.phone?.number,
                },
            },
            {
                cellphone : {
                    code   : data.cellphone?.code,
                    number : data.cellphone?.number,
                },
            },
        ], customerFields );

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

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await validateEntityPermission( uuid, CUSTOMER );

        const deletedCustomer = await strapi.entityService.delete( CUSTOMER, id );

        return deletedCustomer;
    },
}));
