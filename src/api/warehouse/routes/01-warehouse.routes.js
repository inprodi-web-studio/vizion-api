module.exports = {
    routes: [
      {
        method: "GET",
        path: "/warehouses",
        handler: "warehouse.find",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/warehouses",
        handler: "warehouse.create",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "PUT",
        path: "/warehouses/:uuid",
        handler: "warehouse.update",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "PATCH",
        path: "/warehouses/:uuid/toggle",
        handler: "warehouse.toggle",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "DELETE",
        path: "/warehouses/:uuid",
        handler: "warehouse.delete",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};