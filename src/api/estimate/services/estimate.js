'use strict';

/**
 * estimate service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::estimate.estimate');
