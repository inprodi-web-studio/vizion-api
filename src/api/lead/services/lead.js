const dayjs = require("dayjs");
const {
    TAG,
    LEAD,
    USER,
    CONTACT_GROUP,
    CONTACT_SOURCE,
    CONTACT_INTERACTION,
    CUSTOMER,
    ESTIMATE,
    TASK,
    NOTE,
    INSIDER,
} = require("../../../constants/models");

const { BadRequestError } = require("../../../helpers/errors");
const findOneByUuid       = require("../../../helpers/findOneByUuid");

const moment = require("moment-timezone");
const validateEntityPermission = require("../../../helpers/validateEntityPermission");
const { default: axios } = require("axios");

const leadFields = {
    fields   : ["uuid", "tradeName", "finalName", "email", "website", "rating", "isActive", "value", "potential", "createdAt"],
    populate : {
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

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService( LEAD, ({ strapi }) => ({
    async getStats() {
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

        const timeZone         = "America/Mexico_City";
        const startOfMonth     = moment.tz( timeZone ).startOf("month").toISOString();
        const endOfMonth       = moment.tz(timeZone).endOf("month").toISOString();
        const startOfLastMonth = moment.tz(timeZone).subtract(1, "month").startOf("month").toISOString();
        const endOfLastMonth   = moment.tz(timeZone).subtract(1, "month").endOf("month").toISOString();

        const leadsThisMonth = await strapi.query( LEAD ).count({
            where : {
                company  : company.id,
                createdAt : {
                    $gte : startOfMonth,
                    $lte : endOfMonth,
                },
            },
        });

        const leadsLastMonth = await strapi.query( LEAD ).count({
            where : {
                company  : company.id,
                createdAt : {
                    $gte : startOfLastMonth,
                    $lte : endOfLastMonth,
                },
            },
        });

        const convertedButCreatedThisMonth = await strapi.query( CUSTOMER ).count({
            where : {
                company  : company.id,
                leadMeta : {
                    daysToConvert : {
                        $notNull : true,
                    },
                    leadCreatedAt : {
                        $gte : startOfMonth,
                        $lte : endOfMonth,
                    },
                },
            },
        });

        const convertedButCreatedLastMonth = await strapi.query( CUSTOMER ).count({
            where : {
                company  : company.id,
                leadMeta : {
                    daysToConvert : {
                        $notNull : true,
                    },
                    leadCreatedAt : {
                        $gte : startOfLastMonth,
                        $lte : endOfLastMonth,
                    },
                },
            },
        });

        const leadsConvertedThisMonth = await strapi.query( CUSTOMER ).count({
            where : {
                company  : company.id,
                leadMeta : {
                    daysToConvert : {
                        $notNull : true,
                    },
                },
                createdAt : {
                    $gte : startOfMonth,
                    $lte : endOfMonth,
                },
            },
        });

        const leadsConvertedLastMonth = await strapi.query( CUSTOMER ).count({
            where : {
                company  : company.id,
                leadMeta : {
                    daysToConvert : {
                        $notNull : true,
                    },
                },
                createdAt : {
                    $gte : startOfLastMonth,
                    $lte : endOfLastMonth,
                },
            },
        });

        const activitiesThisMonth = await strapi.query( CONTACT_INTERACTION ).count({
            where : {
                company : company.id,
                $or : [
                    {
                        $and : [
                            {
                                lead : {
                                    id : {
                                        $notNull : true,
                                    },
                                },
                            },
                            {
                                createdAt : {
                                    $gte : startOfMonth,
                                    $lte : endOfMonth,
                                },
                            },
                        ],
                    },
                    {
                        $and : [
                            {
                                customer : {
                                    leadMeta : {
                                        daysToConvert : {
                                            $notNull : true,
                                        },
                                    },
                                },
                            },
                            {
                                // createdAt : {
                                //     $gte : startOfMonth,
                                //     $lte : strapi.query( CUSTOMER ).model,
                                // }, 
                            },
                        ],
                    },
                ],
            },
        });

        const activitiesLastMonth = await strapi.query( CONTACT_INTERACTION ).count({
            where : {
                company  : company.id,
                createdAt : {
                    $gte : startOfLastMonth,
                    $lte : endOfLastMonth,
                },
            },
        });

        const totalValue = await strapi.db.connection.raw(`
            SELECT
                SUM(leads.value) AS totalValue
            FROM leads
            JOIN leads_company_links as leads_company ON leads.id = leads_company.lead_id
            WHERE leads_company.company_id = ${company.id}
                AND leads.is_active = 1
        `);

        return {
            active,
            inactive,
            new : {
                current : leadsThisMonth + convertedButCreatedThisMonth,
                passed  : leadsLastMonth + convertedButCreatedLastMonth,
            },
            converted : {
                current : leadsConvertedThisMonth,
                passed  : leadsConvertedLastMonth,
            },
            activities : {
                current : activitiesThisMonth,
                passed  : activitiesLastMonth,
            },
            value : {
                current : 0,
                passed  : 0,
            },
            totalValue : totalValue[0][0].totalValue ?? 0,
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

    async validateParallelData(data) {
        const ctx = strapi.requestContext.get();

        if ( data.responsible ) {
            const { id : responsibleId } = await findOneByUuid( data.responsible, USER );

            data.responsible = responsibleId;
        }

        if ( data.group ) {
            const { id : groupId } = await findOneByUuid( data.group, CONTACT_GROUP );

            data.group = groupId;
        }

        if ( data.source ) {
            const { id : sourceId } = await findOneByUuid( data.source, CONTACT_SOURCE );

            data.source = sourceId;
        }

        if ( data.tags ) {
            for ( let i = 0; i < data.tags.length; i++ ) {
                const tag = data.tags[i];
                const { id : tagId, uuid, entity } = await findOneByUuid( tag, TAG );

                if ( entity !== "contact" ) {
                    throw new BadRequestError( `The tag with uuid ${ uuid } is not a contact tag`, {
                        key  : "lead.invalidTag",
                        path : ctx.request.url,
                    });
                }

                data.tags[i] = tagId;
            }
        }
    },

    async getActivityStats( lead ) {
        const timeZone = "America/Mexico_City";
        const date     = moment.tz( timeZone ).startOf("week").add(1, "days");
        
        const weekDays = [ date.toISOString() ];

        date.add(1, "days");

        while ( date.day() !== 0 ) {
            weekDays.push( date.toISOString() );
            date.add(1, "days");
        }

        weekDays.push( date.toISOString() );

        const data  = [];
        let hasData = false;
        
        for ( let i = 0; i < weekDays.length - 1; i++ ) {
            const day = weekDays[i];

            const activities = await strapi.query( CONTACT_INTERACTION ).count({
                where : {
                    createdAt : {
                        $gte : day,
                        $lt  : weekDays[ i + 1 ],
                    },
                    lead : lead.id,
                },
            });

            if ( activities > 0 ) hasData = true; 

            data.push([i, activities]);
        }

        if ( hasData ) {
            lead.stats = {};
            lead.stats.activities = data;
        }
    },

    async prepareLeadData(uuid, data = {}) {
        return await findOneByUuid( uuid, LEAD, {
            fields : [ ...leadFields.fields ],
            populate : {
                estimates : true,
                ...leadFields.populate,
                ...( data?.tasks && {
                    tasks : true,
                }),
                ...( data?.documents && {
                    documents : true,
                }),
                ...( data?.notes && {
                    notes : true,
                }),
                ...( data?.interactions && {
                    interactions : true,
                }),
            },
        });
    },

    async convertLeadToCustomer(lead, company) {
        const leadCreation = dayjs( lead.createdAt );
        const today        = dayjs();
        const difference   = today.diff( leadCreation, "day" );

        let id = lead.id;

        delete lead.createdAt;
        delete lead.uuid;
        delete lead.id;

        const customer = await strapi.entityService.create( CUSTOMER, {
            data : {
                ...lead,
                leadMeta : {
                    daysToConvert : difference,
                    convertedAt   : new Date(),
                    leadCreatedAt : leadCreation,
                },
                isArchived : false,
                company    : company.id,
            },
            fields : ["uuid"],
        });

        lead.id = id;

        return customer;
    },

    async deleteParallelData(id) {
        const estimates = await strapi.db.query(ESTIMATE).findMany({
            where : {
                lead : id,
            },
        });

        for ( const estimate of estimates ) {
            await strapi.entityService.delete(ESTIMATE, estimate.id);
        }

        const tasks = await strapi.db.query( TASK ).findMany({
            where : {
                lead : id,
            },
        });

        for ( const task of tasks ) {
            await strapi.entityService.delete(TASK, task.id);
        }

        const notes = await strapi.db.query( NOTE ).findMany({
            where : {
                lead : id,
            },
        });

        for ( const note of notes ) {
            await strapi.entityService.delete(NOTE, note.id);
        }

        const interactions = await strapi.db.query( CONTACT_INTERACTION ).findMany({
            where : {
                lead : id,
            },
        });

        for ( const interaction of interactions ) {
            await strapi.entityService.delete(CONTACT_INTERACTION, interaction.id);
        }

        const insiders = await strapi.db.query( INSIDER ).findMany({
            where : {
                lead : id,
            },
        });

        for ( const insider of insiders ) {
            await strapi.entityService.delete(INSIDER, insider.id);
        }
    },

    async generateAddressData({ mainAddress }) {
        const {
            street,
            extNumber,
            cp,
            city,
            state,
            country,
        } = mainAddress ?? {};

        let query = "";

        if ( !street && !extNumber && !cp && !city && !state && country ) {
            query = country;
        } else if ( !street && !extNumber && !cp && !city && state && country ) {
            query = `${ state } ${ country }`;
        } else if ( !street && !extNumber && !cp && city && state && country ) {
            query = `${city} ${ state } ${ country }`;
        } else if ( !street && !extNumber && cp && city && state && country ) {
            query = `${cp} ${city} ${ state } ${ country }`;
        } else {
            query = `${ street ? street : "" } ${ extNumber ? extNumber : "" } ${ cp ? cp : "" } ${ city ? city : "" } ${ state ? state : "" } ${ country ? country : "" }`;
        }

        const URL = `https://api.mapbox.com/search/geocode/v6/forward?access_token=${ process.env.MAPBOX_TOKEN }&proximity=ip&q=${ encodeURI( query ) }`;

        await axios.get( URL ).then( async ({ data }) => {
            mainAddress.longitude = data.features?.[0]?.geometry?.coordinates?.[0]?.toString();
            mainAddress.latitude  = data.features?.[0]?.geometry?.coordinates?.[1]?.toString();
        });
    },
}));
