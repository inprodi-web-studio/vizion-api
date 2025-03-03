const { TAG } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findMany = require('../../../helpers/findMany');
const { validateCreate } = require('../content-types/tag/tag.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const tagFields = {
    fields : ["uuid", "name"],
}

module.exports = createCoreController( TAG, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
            ],
        };

        const tags = await findMany( TAG, tagFields, filters );

        return tags;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        const entity = await strapi.service( TAG ).getEntity();

        await checkForDuplicates( TAG, [
            {
                $and : [
                    { name : data.name },
                    { entity : entity },
                ],
            },
        ]);

        const newTag = await strapi.entityService.create( TAG, {
            data : {
                ...data,
                entity,
                company : company.id,
            },
        });

        return newTag;
    },
}));
