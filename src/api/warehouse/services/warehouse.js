const axios = require('axios');
const { WAREHOUSE, STOCK_LOCATION } = require('../../../constants/models');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(WAREHOUSE, ({ strapi }) => ({
    async generateAddressData({address}) {
        const {
            street,
            extNumber,
            cp,
            city,
            state,
            country,
        } = address ?? {};

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
            address.longitude = data.features?.[0]?.geometry?.coordinates?.[0]?.toString();
            address.latitude  = data.features?.[0]?.geometry?.coordinates?.[1]?.toString();
        });
    },

    async deleteParallelData(id) {
        const locations = await strapi.query(STOCK_LOCATION).findMany({
            where : {
                warehouse : id,
            },
        });

        for ( const location of locations ) {
            await strapi.entityService.delete(STOCK_LOCATION, location.id);
        }
    },
}));
