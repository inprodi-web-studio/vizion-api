const { INSIDER, LEAD, CUSTOMER } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const { ConflictError } = require('../../../helpers/errors');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const validateEntityPermission = require('../../../helpers/validateEntityPermission');
const { validateCreate } = require('../content-types/insider/insider.validation');

const { createCoreService } = require('@strapi/strapi').factories;

const insidersFields = {
    fields   : ["uuid", "email", "isPrimary"],
    populate : {
        completeName : true,
        phone        : true,
    },
};

const relationDictionary = {
    lead     : LEAD,
    customer : CUSTOMER,
};

module.exports = createCoreService( INSIDER, ({ strapi }) => ({
    async getEntityInsiders( relation ) {
        const ctx      = strapi.requestContext.get();
        const { uuid } = ctx.params;

        const entity = await validateEntityPermission( uuid, relationDictionary[relation] );

        const filters = {
            [relation] : entity.id
        };

        const insiders = await findMany( INSIDER, insidersFields, filters );

        return insiders;
    },

    async createEntityInsider( data ) {
        const ctx         = strapi.requestContext.get();
        const { company } = ctx.state;

        const { email, phone } = data;

        await validateCreate( data );

        const entity = await validateEntityPermission( data.entity, relationDictionary[data.relation] );

        let criteria = [];

        if ( email ) {
            criteria.push({
                email,
            });
        }

        if ( phone?.number ) {
            criteria.push({
                phone : {
                    code   : phone?.code,
                    number : phone?.number,
                },
            });
        }

        const conflictingInsider = await strapi.query( INSIDER ).findOne({
            where : {
                [data.relation] : entity.id,
                company         : company.id,
                $or             : criteria,
            },
            select : ["id", "uuid", "email"],
            populate : {
                phone : true,
            },
        });

        if ( conflictingInsider?.email === email ) {
            throw new ConflictError( "Insider with email duplicated", {
                key : "insider.duplicated_Email",
                path : ctx.request.path,
            });
        }

        if ( conflictingInsider?.phone?.number === phone?.number ) {
            throw new ConflictError( "Insider with phone duplicated", {
                key : "insider.duplicated_Phone",
                path : ctx.request.path,
            });
        }

        const newInsider = await strapi.entityService.create( INSIDER, {
            data : {
                ...data,
                [data.relation] : entity.id,
                company         : company.id,
            },
            ...insidersFields,
        });

        return newInsider;
    },

    async updateEntityInsider( data ) {
        const ctx             = strapi.requestContext.get();
        const { insiderUuid } = ctx.params;

        const entity = await validateEntityPermission( data.entity, relationDictionary[data.relation] );

        const insider = await findOneByUuid( insiderUuid, INSIDER );

        if ( data.isPrimary ) {
            const primaryInsider = await strapi.query( INSIDER ).findOne({
                where : {
                    [data.relation] : entity.id,
                    isPrimary        : true,
                },
            });

            if ( primaryInsider ) {
                await strapi.entityService.update( INSIDER, primaryInsider.id, {
                    data : {
                        isPrimary : false,
                    },
                });
            }
        }

        const updatedInsider = await strapi.entityService.update( INSIDER, insider.id, {
            data : {
                ...data,
                [data.relation] : entity.id,
            },
            ...insidersFields
        });

        return updatedInsider;
    },

    async setPrimary( relation ) {
        const ctx      = strapi.requestContext.get();
        const { uuid, insiderUuid } = ctx.params;

        const entity = await validateEntityPermission( uuid, relationDictionary[relation] );

        const insider = await findOneByUuid( insiderUuid, INSIDER );

        const currentPrimary = await strapi.query( INSIDER ).findOne({
            where : {
                isPrimary : true,
                [relation] : entity.id,
            },
        });

        await strapi.entityService.update( INSIDER, currentPrimary.id, {
            data : {
                isPrimary : false,
            },
        });

        const updatedInsider = await strapi.entityService.update( INSIDER, insider.id, {
            data : {
                isPrimary : true,
            },
        });

        return updatedInsider;
    },

    async deleteEntityInsider( relation ) {
        const ctx      = strapi.requestContext.get();
        const { uuid, insiderUuid } = ctx.params;

        await validateEntityPermission( uuid, relationDictionary[relation] );

        const insider = await findOneByUuid( insiderUuid, INSIDER );

        const deletedInsider = await strapi.entityService.delete( INSIDER, insider.id, insidersFields );

        return deletedInsider;
    },
}));
