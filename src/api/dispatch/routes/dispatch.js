'use strict';

/**
 * dispatch router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::dispatch.dispatch');
