const dayjs = require("dayjs");
const { STOCK_RELEASE } = require("../../../constants/models");
const product = require("../../product/controllers/product");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(STOCK_RELEASE, ({ strapi }) => ({
  async createStockReleases({ items, id, deliveryDate }) {
    const stockItems = items.filter((i) => i.product?.stockInfo?.id);

    let promises = [];

    for (let i = 0; i < stockItems.length; i++) {
      const item = stockItems[i];
      const releaseDate = dayjs(deliveryDate)
        .subtract(1, "day")
        .format("YYYY-MM-DD");

      promises.push(
        strapi.entityService.create(STOCK_RELEASE, {
          data: {
            unity: item.unity.id,
            quantity: item.quantity,
            product: item.product.id,
            package: item.package?.id,
            realQuantity: item.realQuantity,
            variation: item.variation?.id,
            sale: id,
            releaseDate,
            isCompleted: false,
          },
        })
      );
    }

    return await Promise.all(promises);
  },
}));
