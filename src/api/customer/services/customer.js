const { CUSTOMER, USER, CONTACT_GROUP, CONTACT_SOURCE, TAG, PRICE_LIST, ESTIMATE, TASK, NOTE, CONTACT_INTERACTION, INSIDER, SALE, CUSTOMER_CREDIT } = require('../../../constants/models');

const { createCoreService } = require('@strapi/strapi').factories;

const moment = require("moment-timezone");
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { BadRequestError } = require('../../../helpers/errors');
const axios = require('axios');

module.exports = createCoreService( CUSTOMER, ({ strapi }) => ({
    async getStats() {
        const ctx         = strapi.requestContext.get();
        const { company } = ctx.state;

        const active = await strapi.query( CUSTOMER ).count({
            where : {
                company    : company.id,
                isArchived : false,
            },
        });

        const archived = await strapi.query( CUSTOMER ).count({
            where : {
                company    : company.id,
                isArchived : true,
            },
        });

        const timeZone         = "America/Mexico_City";
        const startOfMonth     = moment.tz( timeZone ).startOf("month").toISOString();
        const endOfMonth       = moment.tz(timeZone).endOf("month").toISOString();
        const startOfLastMonth = moment.tz(timeZone).subtract(1, "month").startOf("month").toISOString();
        const endOfLastMonth   = moment.tz(timeZone).subtract(1, "month").endOf("month").toISOString();

        const customersThisMonth = await strapi.query( CUSTOMER ).count({
            where : {
                company    : company.id,
                createdAt : {
                    $gte : startOfMonth,
                    $lte : endOfMonth,
                },
            },
        });

        const customersLastMonth = await strapi.query( CUSTOMER ).count({
            where : {
                company    : company.id,
                createdAt : {
                    $gte : startOfLastMonth,
                    $lte : endOfLastMonth,
                },
            },
        });

        return {
            active,
            archived,
            new : {
                current : customersThisMonth,
                passed  : customersLastMonth,
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
                        key  : "customer.invalidTag",
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
                    key  : "customer.unkownKey",
                    path : ctx.request.url,
                });
        }

        return entityId;
    },

    async validateParallelData(data) {
        const ctx = strapi.requestContext.get();

        const { id : priceListId } = await findOneByUuid( data.priceList, PRICE_LIST );

        data.priceList = priceListId;

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
                        key  : "customer.invalidTag",
                        path : ctx.request.url,
                    });
                }

                data.tags[i] = tagId;
            }
        }
    },

    async deleteParallelData(id) {
        const estimates = await strapi.db.query(ESTIMATE).findMany({
            where : {
                customer : id,
            },
        });

        const sales = await strapi.db.query(SALE).findMany({
            where : {
                customer : id,
            },
        });

        for ( const sale of sales ) {
            await strapi.entityService.delete(SALE, sale.id);
        }

        for ( const estimate of estimates ) {
            await strapi.entityService.delete(ESTIMATE, estimate.id);
        }

        const creditHistory = await strapi.db.query( CUSTOMER_CREDIT ).findMany({
            where : {
                customer : id,
            },
        });

        for ( const credit of creditHistory ) {
            await strapi.entityService.delete(CUSTOMER_CREDIT, credit.id);
        }

        const tasks = await strapi.db.query( TASK ).findMany({
            where : {
                customer : id,
            },
        });

        for ( const task of tasks ) {
            await strapi.entityService.delete(TASK, task.id);
        }

        const notes = await strapi.db.query( NOTE ).findMany({
            where : {
                customer : id,
            },
        });

        for ( const note of notes ) {
            await strapi.entityService.delete(NOTE, note.id);
        }

        const interactions = await strapi.db.query( CONTACT_INTERACTION ).findMany({
            where : {
                customer : id,
            },
        });

        for ( const interaction of interactions ) {
            await strapi.entityService.delete(CONTACT_INTERACTION, interaction.id);
        }

        const insiders = await strapi.db.query( INSIDER ).findMany({
            where : {
                customer : id,
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
