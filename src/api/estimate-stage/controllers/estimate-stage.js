const { ESTIMATE_STAGE } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const { BadRequestError } = require('../../../helpers/errors');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/estimate-stage/estimate-stage.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const stageFields = {
    fields   : ["uuid", "name", "potential", "isDefault"],
    populate : {
        estimates : {
            count : true,
        },
    },
};

module.exports = createCoreController( ESTIMATE_STAGE, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
            ],
        };

        const stages = await findMany( ESTIMATE_STAGE, stageFields, filters );

        return stages;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( ESTIMATE_STAGE, [
            {
                name : data.name,
            },
            {
                potential : data.potential,
            },
        ]);

        const count = await strapi.query( ESTIMATE_STAGE ).count({
            where : {
                company : company.id,
            },
        });

        if ( count === 10 ) {
            throw new BadRequestError( "Maximum number of stages reached (10)", {
                key : "estimateStage.limitReached",
                path : ctx.request.url,
            });
        }

        const newStage = await strapi.entityService.create( ESTIMATE_STAGE, {
            data : {
                ...data,
                company : company.id,
            },
            ...stageFields
        });

        return newStage;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const stage = await findOneByUuid( uuid, ESTIMATE_STAGE );

        await checkForDuplicates( ESTIMATE_STAGE, [
            {
                name : data.name,
            },
            {
                potential : data.potential,
            }
        ]);

        const updatedStage = await strapi.entityService.update( ESTIMATE_STAGE, stage.id, {
            data : {
                ...( stage.isDefault ? {
                    name : data.name,
                } : {
                    ...data,
                }),
            },
            ...stageFields
        });

        return updatedStage;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const stage = await findOneByUuid( uuid, ESTIMATE_STAGE );

        if ( stage.isDefault ) {
            throw new BadRequestError( "Cannot delete default stage", {
                key : "estimateStage.defaultStage",
                path : ctx.request.url,
            });
        }

        const deletedStage = await strapi.entityService.delete( ESTIMATE_STAGE, stage.id, stageFields );

        return deletedStage;
    },
}));
