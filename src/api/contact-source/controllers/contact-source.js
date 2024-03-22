const { CONTACT_SOURCE } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findMany           = require('../../../helpers/findMany');
const findOneByUuid      = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/contact-source/contact-source.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const sourceFields = {
    fields   : ["uuid", "name", "icon"],
    populate : {
        leads : {
            count : true,
        },
    },
};

module.exports = createCoreController( CONTACT_SOURCE, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
            ],
        };

        const sources = await findMany( CONTACT_SOURCE, sourceFields, filters );

        return sources;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( CONTACT_SOURCE, [
            {
                name : data.name,
            },
        ]);

        const newSource = await strapi.entityService.create( CONTACT_SOURCE, {
            data : {
                ...data,
                company : company.id,
            },
            ...sourceFields
        });

        return newSource;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const source = await findOneByUuid( uuid, CONTACT_SOURCE );

        await checkForDuplicates( CONTACT_SOURCE, [
            {
                name : data.name,
            }
        ]);

        const updatedSource = await strapi.entityService.update( CONTACT_SOURCE, source.id, {
            data : {
                ...data,
            },
            ...sourceFields
        });

        return updatedSource;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const source = await findOneByUuid( uuid, CONTACT_SOURCE );

        const deletedSource = await strapi.entityService.delete( CONTACT_SOURCE, source.id, sourceFields );

        return deletedSource;
    },
}));
