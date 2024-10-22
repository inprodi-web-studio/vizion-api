'use strict';

/**
 * customer-credit service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::customer-credit.customer-credit');
