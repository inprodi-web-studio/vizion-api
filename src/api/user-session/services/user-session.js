'use strict';

/**
 * user-session service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-session.user-session');
