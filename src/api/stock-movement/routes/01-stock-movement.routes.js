module.exports = {
    routes: [
      {
        method: "GET",
        path: "/warehouses/:uuid/stock-locations/:locationUuid/stock-movements",
        handler: "stock-movement.find",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/stock-movements/adjustment",
        handler: "stock-movement.createAdjustment",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/stock-movements/relocation",
        handler: "stock-movement.createRelocation",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};