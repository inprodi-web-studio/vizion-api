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

  getApplicableItems(promotion, order) {
    if (!Array.isArray(promotion.productsQuery)) return [];

    return order.items.filter((item) =>
      promotion.productsQuery.some((group) =>
        group.every((filter) => {
          const prod = item.product;

          switch (filter.type) {
            case "all":
              return true;

            case "products":
              return filter.entities.some((e) => e.uuid === prod.uuid);

            case "categories":
              return filter.entities.some(
                (c) => prod.category?.uuid === c.uuid
              );

            case "brands":
              return filter.entities.some((b) => prod.brand?.uuid === b.uuid);

            case "tags":
              return filter.entities.some((t) => prod.tags?.uuid === t.uuid);

            default:
              return false;
          }
        })
      )
    );
  },

  async evaluateConditions(promotion, order) {
    const subtotal = order.resume?.subtotal ?? 0;
    const total = order.resume?.total ?? 0;
    const customer = order.customer;
    const lead = order.lead;
    const responsible = order.responsible;

    if (!Array.isArray(promotion.conditions)) return false;

    const groupResults = await Promise.all(
      (promotion.conditions || []).map(async (group) => {
        if (
          group.length === 0 ||
          (group.length === 1 && Object.keys(group[0]).length === 0)
        ) {
          return true;
        }

        for (const cond of group) {
          switch (cond.type) {
            case "subtotal": {
              const { operator, value } = cond.config;
              if (operator === "gte" && !(subtotal >= value)) return false;
              if (operator === "lte" && !(subtotal <= value)) return false;
              break;
            }

            case "total": {
              const { operator, value } = cond.config;
              if (operator === "gte" && !(total >= value)) return false;
              if (operator === "lte" && !(total <= value)) return false;
              break;
            }

            case "firstSale": {
              if (lead) {
                break;
              }

              const count = await strapi.entityService.count(SALE, {
                filters: {
                  customer: customer.id,
                },
              });

              if (count > 0) return false;
              break;
            }

            case "contactType": {
              const { value } = cond.config;

              if (customer && value === "customer") {
                break;
              }

              if (lead && value === "lead") {
                break;
              }

              return false;
            }

            case "customers": {
              return cond.entities.some((e) => e.uuid === customer?.uuid);
            }

            case "leads": {
              return cond.entities.some((e) => e.uuid === lead?.uuid);
            }

            case "groups": {
              return cond.entities.some((e) => {
                if (customer) {
                  return customer.group?.uuid === e.uuid;
                }

                if (lead) {
                  return lead.group?.uuid === e.uuid;
                }

                return false;
              });
            }

            case "sources": {
              return cond.entities.some((e) => {
                if (customer) {
                  return customer.source?.uuid === e.uuid;
                }

                if (lead) {
                  return lead.source?.uuid === e.uuid;
                }

                return false;
              });
            }

            case "contactTags": {
              return cond.entities.some((e) => {
                if (customer) {
                  return customer.tags?.some((t) => t.uuid === e.uuid);
                }

                if (lead) {
                  return lead.tags?.some((t) => t.uuid === e.uuid);
                }

                return false;
              });
            }

            case "state": {
              return cond.entities.some((e) => {
                if (customer) {
                  return customer.mainAddress?.state === e.state;
                }

                if (lead) {
                  return lead.mainAddress?.state === e.state;
                }

                return false;
              });
            }

            case "user": {
              return cond.entities.some((e) => responsible?.uuid === e.uuid);
            }

            case "products": {
              const { type : metric, value } = cond.config;

              const productUuids = cond.entities.map((e) => e.uuid);

              const relevantItems = order.items.filter(
                (item) =>
                  productUuids.includes(item.product.uuid)
              );

              const sum = relevantItems.reduce((acc, item) => {
                return (
                  acc +
                  (metric === "amount"
                    ? item.quantity * item.price
                    : item.quantity)
                );
              }, 0);

              if (sum < value) {
                return false;
              }

              break;
            }

            case "brands": {
              const { type : metric, value } = cond.config;

              const brandUuids = cond.entities.map((e) => e.uuid);

              const relevantItems = order.items.filter(
                (item) =>
                  item.product.brand?.id &&
                  brandUuids.includes(item.product.brand.id)
              );

              const sum = relevantItems.reduce((acc, item) => {
                return (
                  acc +
                  (metric === "amount"
                    ? item.quantity * item.price
                    : item.quantity)
                );
              }, 0);

              if (sum < value) {
                return false;
              }

              break;
            }

            case "categories": {
              const { type : metric, value } = cond.config;

              const categoryUuids = cond.entities.map((e) => e.uuid);

              const relevantItems = order.items.filter(
                (item) =>
                  item.product.category?.id &&
                  categoryUuids.includes(item.product.category.id)
              );

              const sum = relevantItems.reduce((acc, item) => {
                return (
                  acc +
                  (metric === "amount"
                    ? item.quantity * item.price
                    : item.quantity)
                );
              }, 0);

              if (sum < value) {
                return false;
              }

              break;
            }

            case "productTags": {
              const { type : metric, value } = cond.config;

              const tagUuids = cond.entities.map((e) => e.uuid);

              const relevantItems = order.items.filter(
                (item) =>
                  item.product.tags?.some((t) => tagUuids.includes(t.id))
              );

              const sum = relevantItems.reduce((acc, item) => {
                return (
                  acc +
                  (metric === "amount"
                    ? item.quantity * item.price
                    : item.quantity)
                );
              }, 0);

              if (sum < value) {
                return false;
              }

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
