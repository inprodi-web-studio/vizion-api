const defaultPreferences = require("../../../constants/defaultPreferences");
const { PREFERENCE } = require("../../../constants/models");

const { createCoreService } = require("@strapi/strapi").factories;

const preferenceFields = {
    fields   : ["uuid", "app", "module", "config"],
};

module.exports = createCoreService(PREFERENCE, ({ strapi }) => ({
    async findOrCreate(company, app, module) {
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
