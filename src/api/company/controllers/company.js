const { COMPANY, USER } = require('../../../constants/models');
const { UnprocessableContentError } = require('../../../helpers/errors');
const findOneByAny = require('../../../helpers/findOneByAny');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController( COMPANY, ({ strapi }) => ({
    async findOne(ctx) {
        const { user } = ctx.state;

        const { company } = await findOneByUuid( user.uuid, USER, {
            populate : {
                company : {
                    fields : ["uuid", "name", "website", "primaryColor", "applications"],
                    populate : {
                        logotype : {
                            fields : ["url", "name"],
                        },
                        fiscalInfo : {
                            fields : ["legalName", "rfc", "regime"],
                            populate : {
                                address : true,
                            },
                        },
                        address : true,
                    },
                },
            },
        });

        return company;
    },

    async findByUrlParam (ctx) {
        const { urlParam } = ctx.params;

        const company = await findOneByAny( urlParam, COMPANY, "urlParam", {
            fields : ["uuid", "primaryColor"],
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
