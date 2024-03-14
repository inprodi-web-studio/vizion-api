const { LEAD }                 = require('../../../constants/models');
const findMany                 = require('../../../helpers/findMany');
const { validateCreate }       = require('../content-types/lead/lead.validation');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const checkForDuplicates       = require('../../../helpers/checkForDuplicates');

const { createCoreController } = require('@strapi/strapi').factories;

const leadFields = {
    fields   : ["uuid", "tradeName", "email", "rating", "isActive"],
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
        const user = ctx.state.user;

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

        return leads;
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;
        
        const lead = await validateEntityPermission( uuid, LEAD, leadFields );

        return lead;
    },

    async create(ctx) {
        const user    = ctx.state.user;
        const company = ctx.state.company;

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
                company : company.id,
            },
            ...leadFields,
        });

        return newLead;
    },
    
    async keyUpdate(ctx) {

    },
}));