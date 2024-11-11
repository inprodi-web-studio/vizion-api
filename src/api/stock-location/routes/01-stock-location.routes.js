module.exports = {
    routes: [
      {
        method: "GET",
        path: "/warehouses/:uuid/stock-locations",
        handler: "stock-location.find",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/warehouses/:uuid/stock-locations",
        handler: "stock-location.create",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "PUT",
        path: "/warehouses/:uuid/stock-locations/:locationUuid",
        handler: "stock-location.update",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};