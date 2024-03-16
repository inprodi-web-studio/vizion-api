const { LEAD }                 = require('../../../constants/models');
const findMany                 = require('../../../helpers/findMany');
const { validateCreate }       = require('../content-types/lead/lead.validation');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const checkForDuplicates       = require('../../../helpers/checkForDuplicates');
const { validateKeyUpdate }    = require('../../../helpers/validateKeyUpdate');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreController } = require('@strapi/strapi').factories;

const leadFields = {
    fields   : ["uuid", "tradeName", "email", "rating", "isActive", "value", "potential"],
    populate : {
        completeName : true,
        phone        : true,
        mainAddress  : true,
        fiscalInfo   : true,
        group        : true,
        source       : true,
        tags         : true,
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

module.exports = createCoreController( LEAD, ({ strapi }) => ({
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
            ...( user.role.name === "sales-agent" && {
                responsible : user.id,
            }),
        };

        const leads = await findMany( LEAD, leadFields, filters );

        if ( query?.stats ) {
            await strapi.service( LEAD ).addStats( leads );
        }

        return leads;
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;
        
        const lead = await validateEntityPermission( uuid, LEAD, leadFields );

        return lead;
    },

    async create(ctx) {
        const { user, company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        if ( user.role.name === "sales-agent" ) {
            data.responsible = user.id;
        }

        await checkForDuplicates( LEAD, [
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
                fiscalInfo : {
                    rfc : data.fiscalInfo?.rfc,
                },
            },
            {
                fiscalInfo : {
                    legalName : data.fiscalInfo?.legalName,
                },
            },
        ], leadFields );

        const newLead = await strapi.entityService.create( LEAD, {
            data : {
                ...data,
                company   : company.id,
                value     : 0,
                potential : 0,
            },
            ...leadFields,
        });

        return newLead;
    },
    
    async keyUpdate(ctx) {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        await validateKeyUpdate( data );

        const { id } = await validateEntityPermission( uuid, LEAD );

        const entityId = await strapi.service( LEAD ).keyFind( data );

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

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await validateEntityPermission( uuid, LEAD );

        const deletedLead = await strapi.entityService.delete( LEAD, id );

        return deletedLead;
    },
}));