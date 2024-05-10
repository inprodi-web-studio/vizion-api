'use strict';

/**
 * estimate-stage service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::estimate-stage.estimate-stage');
