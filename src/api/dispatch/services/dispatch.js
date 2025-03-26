'use strict';

/**
 * dispatch service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::dispatch.dispatch');
