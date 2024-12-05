'use strict';

/**
 * stock-dispatch service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::stock-dispatch.stock-dispatch');
