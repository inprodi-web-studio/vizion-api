const { COMPANY } = require('../../../constants/models');
const { UnprocessableContentError } = require('../../../helpers/errors');
const findOneByAny = require('../../../helpers/findOneByAny');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController( COMPANY, ({ strapi }) => ({
    async findByUrlParam (ctx) {
        const { urlParam } = ctx.params;

        const company = await findOneByAny( urlParam, COMPANY, "urlParam", {
            fields : ["uuid"],
            populate : {
                logotype : {
                    fields : ["url", "name"],
                },
            },
        }, false );

        return company;
    },

    async setLogotype (ctx) {
        const company = ctx.state.company;
        const { image } = ctx.request.files ?? {};

        if ( !image ) {
            throw new UnprocessableContentError(["Image is required"]);
        }

        await strapi.plugins.upload.services.upload.uploadToEntity({
            id    : company.id,
            model : COMPANY,
            field : "logotype",
        }, image );

        return company;
    },

    async removeLogotype(ctx) {
        const { id } = ctx.state.company;

        const updatedCompany = await strapi.entityService.update( COMPANY, id, {
            data : {
                logotype : null,
            },
        });

        return updatedCompany;
    },
}));
