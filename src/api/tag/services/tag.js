const { TAG } = require('../../../constants/models');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService( TAG, ({ strapi }) => ({
    async getEntity() {
        const ctx = strapi.requestContext.get();
        const url = ctx.request.url;

        let entity;

        if ( url.includes( "contacts" ) ) {
            entity = "contact";
        }

        if ( url.includes( "product-tags" ) ) {
            entity = "product";
        }

        return entity;
    },
}));
