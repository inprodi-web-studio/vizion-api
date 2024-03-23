const { LEAD, CONTACT_GROUP, USER, CONTACT_SOURCE, TAG } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService( LEAD, ({ strapi }) => ({
    async addStats( leads ) {
        const ctx         = strapi.requestContext.get();
        const { company } = ctx.state;

        const active = await strapi.query( LEAD ).count({
            where : {
                isActive : true,
                company  : company.id,
            },
        });

        const inactive = await strapi.query( LEAD ).count({
            where : {
                isActive : false,
                company  : company.id,
            },
        });

        leads.stats = {
            active,
            inactive,
            new : {
                current : 0,
                passed  : 0,
            },
            converted : {
                current : 0,
                passed  : 0,
            },
            activities : {
                current : 0,
                passed  : 0,
            },
            value : {
                current : 0,
                passed  : 0,
            },
        };
    },

    async keyFind({ key, value }, tags = []) {
        const ctx = strapi.requestContext.get();

        let entityId;

        switch ( key ) {
            case "responsible":
                if ( value ) {
                    const { id : responsibleId } = await findOneByUuid( value, USER );
                    
                    entityId = responsibleId;
                } else {
                    entityId = null;
                }
            break;

            case "group":
                if ( value ) {
                    const { id : groupId } = await findOneByUuid( value, CONTACT_GROUP );
                    
                    entityId = groupId;
                } else {
                    entityId = null;
                }
            break;

            case "source":
                if ( value ) {
                    const { id : sourceId } = await findOneByUuid( value, CONTACT_SOURCE );
                    
                    entityId = sourceId;
                } else {
                    entityId = null;
                }
            break;

            case "tags":
                const { id : tagId, uuid, entity } = await findOneByUuid( value, TAG );

                if ( entity !== "contact" ) {
                    throw new BadRequestError( `The tag ${value} is not a contact tag`, {
                        key  : "lead.invalidTag",
                        path : ctx.request.url,
                    });
                }

                const index = tags.findIndex( t => t.uuid === uuid );

                if ( index === -1 ) {
                    tags.push( tagId );
                } else {
                    tags.splice( index, 1 );
                }

                entityId = tags;
            break;

            case "rating":
                entityId = value;
            break;

            default:
                throw new BadRequestError( `The key ${key} is not supported in key update`, {
                    key  : "lead.unkownKey",
                    path : ctx.request.url,
                });
        }

        return entityId;
    },
}));
