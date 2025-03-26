'use strict';

/**
 * picking service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::picking.picking');
