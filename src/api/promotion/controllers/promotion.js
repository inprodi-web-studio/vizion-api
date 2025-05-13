const dayjs = require('dayjs');
const { PROMOTION } = require('../../../constants/models');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/promotion/promotion.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const promotionFields = {
    fields: ["uuid", "name", "description", "startDate", "endDate", "autoApply", "force", "type", "conditions", "discount", "productsQuery", "isActive"],
    populate: {
        createdByUser: {
            fields: ["uuid", "name", "middleName", "lastName"],
            populate: {
                image: {
                    fields: ["url"],
                },
            },
        },
    },
};

module.exports = createCoreController(PROMOTION, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search: [
                "name",
                "description"
            ],
        };

        const promotions = await findMany(PROMOTION, promotionFields, filters);

        return promotions;
    },

    async getStats() {
        return await strapi.service(PROMOTION).getStats();
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;

        const promotion = await findOneByUuid(uuid, PROMOTION);

        return promotion;
    },

    async create(ctx) {
        const { company, user } = ctx.state;
        const data = ctx.request.body;

        await validateCreate(data);

        const newPromotion = await strapi.entityService.create(PROMOTION, {
            data: {
                ...data,
                isActive: true,
                company: company.id,
                createdByUser: user.id,
            },
            ...promotionFields,
        });

        return newPromotion;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate(data);

        const promotion = await findOneByUuid(uuid, PROMOTION);

        const updatedPromotion = await strapi.entityService.update(PROMOTION, promotion.id, {
            data: {
                ...data,
            },
            ...promotionFields,
        });

        return updatedPromotion;
    },

    async toggle(ctx) {
        const { uuid } = ctx.params;

        const promotion = await findOneByUuid(uuid, PROMOTION);

        const updatedPromotion = await strapi.entityService.update(PROMOTION, promotion.id, {
            data: {
                isActive: !promotion.isActive,
            },
            ...promotionFields,
        });

        return updatedPromotion;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const promotion = await findOneByUuid(uuid, PROMOTION);

        const deletedPromotion = await strapi.entityService.delete(PROMOTION, promotion.id, promotionFields);

        return deletedPromotion;
    },

    async checkApplicable(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;
        const today = dayjs().format("YYYY-MM-DD");

        const promotions = await strapi.query(PROMOTION).findMany({
            where: {
                isActive: true,
                startDate: { $lte: today },
                $or: [
                    { endDate: null },
                    { endDate: { $gte: today } }
                ],
                company: company.id,
            },
            ...promotionFields,
        });

        const applicable = [];

        for (const promo of promotions) {
          if (
            await strapi.service(PROMOTION).evaluateProducts(promo, data) &&
            await strapi.service(PROMOTION).evaluateConditions(promo, data)
          ) {
            applicable.push(promo);
          }
        }

        return applicable;
    },
}));
