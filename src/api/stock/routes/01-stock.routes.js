module.exports = {
  routes: [
    {
      method: "GET",
      path: "/warehouses/:uuid/stock-locations/:locationUuid/stocks",
      handler: "stock.find",
      config: {
        policies: ["global::userContext"],
      },
    },
    {
      method: "GET",
      path: "/stocks/:locationUuid",
      handler: "stock.getStockByEntity",
      config: {
        policies: ["global::userContext"],
      },
    },
    {
      method: "POST",
      path: "/deache",
      handler: "stock.deache",
      config: {
        policies: ["global::userContext"],
      },
    },
  ],
};
