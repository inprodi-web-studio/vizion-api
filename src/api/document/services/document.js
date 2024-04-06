const { DOCUMENT } = require('../../../constants/models');

const { uuid } = require("uuidv4");

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService( DOCUMENT, ({ strapi }) => ({
    async uploadDocument(file) {

    },
}));
