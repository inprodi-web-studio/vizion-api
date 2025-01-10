const { INT_ROLE } = require('../../../constants/models');
const { NotFoundError } = require('../../../helpers/errors');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController( INT_ROLE, ({ strapi }) => ({
    async getAppPermissions(ctx) {
        console.log("app permissions");
        const { app } = ctx.params;
        const user = ctx.state.user;

        const { intRole } = user;

        if ( !intRole ) {
            throw new NotFoundError("Role not found", {
                key : "intRole.notFound",
                path : ctx.request.path,
            });
        }

        const permissions = intRole.permissions[app];

        if ( !permissions ) {
            throw new NotFoundError("Invalid route provided", {
                key : "intRole.invalidRoute",
                path : ctx.request.path,
            });
        }

        return permissions;
    },

    async getModulePermissions(ctx) {
        const { app, module } = ctx.params;
        const user = ctx.state.user;

        const { intRole } = user;

        if ( !intRole ) {
            throw new NotFoundError("Role not found", {
                key : "intRole.notFound",
                path : ctx.request.path,
            });
        }

        const permissions = intRole.permissions[app]?.[module];

        if ( !permissions ) {
            throw new NotFoundError("Invalid route provided", {
                key : "intRole.invalidRoute",
                path : ctx.request.path,
            });
        }

        return permissions;
    },
}));
