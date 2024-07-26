const defaultPreferences = require('../../../constants/defaultPreferences');
const { PREFERENCE } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');

const { createCoreController } = require('@strapi/strapi').factories;

const preferenceFields = {
    fields   : ["uuid", "app", "module", "config"],
};

module.exports = createCoreController( PREFERENCE, ({ strapi }) => ({
    async findByModule(ctx) {
        const { app, module } = ctx.params;
        const { company } =  ctx.state;

        const validApps = ["crm"];
        const validModules = ["leads", "customers", "products", "estimates", "sales"];

        if ( !validApps.includes(app) ) {
            throw new BadRequestError("The app is invalid", {
                key  : "preference.invalidApp",
                path : ctx.request.path,
            });
        }

        if ( !validModules.includes(module) ) {
            throw new BadRequestError("The module is invalid", {
                key  : "preference.invalidModule",
                path : ctx.request.path,
            });
        }

        const preference = await strapi.query(PREFERENCE).findOne({
            where : {
                company : company.id,
                app,
                module,
            },
        });

        if ( !preference ) {
            return await strapi.entityService.create( PREFERENCE, {
                data : {
                    app,
                    module,
                    config  : defaultPreferences[ app ][ module ],
                    company : company.id,
                },
                ...preferenceFields
            });
        }

        return preference;
    },
}));
