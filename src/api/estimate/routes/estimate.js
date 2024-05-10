'use strict';

/**
 * estimate router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::estimate.estimate');
