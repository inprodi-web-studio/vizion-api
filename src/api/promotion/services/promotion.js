const { PROMOTION, SALE } = require("../../../constants/models");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(PROMOTION, ({ strapi }) => ({
    async getStats() {
        const ctx = strapi.requestContext.get();
        const { company } = ctx.state;

        const active = await strapi.query(PROMOTION).count({
            where: {
                isActive: true,
                company: company.id,
            },
        });

        const inactive = await strapi.query(PROMOTION).count({
            where: {
                isActive: false,
                company: company.id,
            },
        });

        return { active, inactive };
    },

    async evaluateProducts(promotion, order) {
        const items = order.items;

        if (!Array.isArray(promotion.productsQuery)) return false;

        return promotion.productsQuery.some(group => {
            if (group.length === 1 && group[0].type === 'all') {
                return true;
            }

            return items.some(item => {
                return group.every(filter => {
                    const prod = item.product;

                    switch (filter.type) {
                        case 'all':
                            return true;

                        case 'products':
                            return filter.entities.some(e => e.id === prod.id);

                        case 'categories':
                            return filter.entities.some(c => prod.category?.id === c.id);

                        case 'brands':
                            console.log(prod)
                            console.log(filter.entities)
                            return filter.entities.some(b => prod.brand?.id === b.id);

                        default:
                            return false;
                    }
                });
            });
        });
    },

    async evaluateConditions(promotion, order) {
        const subtotal = order.resume?.subtotal ?? 0;
        const total = order.resume?.total ?? 0;
        const customer = order.customer;

        if (!Array.isArray(promotion.conditions)) return false;

        const groupResults = await Promise.all(
            (promotion.conditions || []).map(async group => {
                if (group.length === 0 || (group.length === 1 && Object.keys(group[0]).length === 0)) {
                    return true;
                }

                for (const cond of group) {
                    switch (cond.type) {
                        case 'subtotal': {
                            const { operator, value } = cond.config;
                            if (operator === 'gte' && !(subtotal >= value)) return false;
                            if (operator === 'lte' && !(subtotal <= value)) return false;
                            break;
                        }

                        case 'total': {
                            const { operator, value } = cond.config;
                            if (operator === 'gte' && !(total >= value)) return false;
                            if (operator === 'lte' && !(total <= value)) return false;
                            break;
                        }

                        case 'firstSale': {
                            const count = await strapi.entityService.count(SALE, {
                                filters: {
                                    customer: customer.id,
                                }
                            });

                            if (count > 0) return false;
                            break;
                        }

                        default:
                            return false;
                    }
                }
                return true;
            })
        );
        return groupResults.some(Boolean);
    },
}));
