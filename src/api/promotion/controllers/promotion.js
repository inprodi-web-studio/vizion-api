const { PROMOTION } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/promotion/promotion.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const promotionFields = {
    fields : ["uuid", "name", "description", "startDate", "endDate", "autoApply", "force", "type", "conditions", "discount", "productsQuery", "isActive"],
};

module.exports = createCoreController(PROMOTION, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
                "description"
            ],
        };

        const promotions = await findMany( PROMOTION, promotionFields, filters );

        return promotions;
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;

        const promotion = await findOneByUuid( uuid, PROMOTION );

        return promotion;
    },

    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        return data;

        console.log(data);

        const newPromotion = await strapi.entityService.create( PROMOTION, {
            data : {
                ...data,
                isActive : true,
                company : company.id,
            },
            ...promotionFields,
        });

        return newPromotion;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const promotion = await findOneByUuid( uuid, PROMOTION );

        const updatedPromotion = await strapi.entityService.update( PROMOTION, promotion.id, {
            data : {
                ...data,
            },
            ...promotionFields,
        });

        return updatedPromotion;
    },

    async toggle(ctx) {
        const { uuid } = ctx.params;

        const promotion = await findOneByUuid( uuid, PROMOTION );

        const updatedPromotion = await strapi.entityService.update( PROMOTION, promotion.id, {
            data : {
                isActive : !promotion.isActive,
            },
            ...promotionFields,
        });

        return updatedPromotion;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const promotion = await findOneByUuid( uuid, PROMOTION );

        const deletedPromotion = await strapi.entityService.delete( PROMOTION, promotion.id, promotionFields );

        return deletedPromotion;
    },
}));
