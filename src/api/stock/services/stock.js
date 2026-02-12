const { STOCK } = require("../../../constants/models");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(STOCK, ({ strapi }) => ({
  async formatStockData(data) {
    let parsedData = [];

    data.forEach((item) => {
      const variations = item.stocks?.filter((stock) => stock.variation?.uuid);

      if (variations?.length > 0) {
        parsedData.push({
          hasVariation: true,
          ...item,
        });

        let variationsMap = {};

        variations.forEach((variationStock) => {
          const variationUuid = variationStock.variation.uuid;

          if (!variationsMap[variationUuid]) {
            variationsMap[variationUuid] = {
              product: item.product,
              variation: {
                uuid: variationUuid,
                sku: variationStock.variation.sku,
                values: variationStock.variation.values,
                stocks: [],
              },
            };
          }

          variationsMap[variationUuid].variation.stocks.push({
            badge: variationStock.badge,
            unity: variationStock.unity,
            package: variationStock.package,
            quantity: variationStock.quantity,
            packageQuantity: variationStock.packageQuantity,
            reservations: variationStock.reservations ?? [],
          });
        });

        Object.values(variationsMap).forEach((variationItem) => {
          parsedData.push(variationItem);
        });
      } else {
        parsedData.push(item);
      }
    });

    return parsedData;
  },
}));
