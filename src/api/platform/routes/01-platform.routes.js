module.exports = {
    routes: [
      {
        method: "GET",
        path: "/warehouses/:uuid/platforms",
        handler: "platform.find",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/warehouses/:uuid/platforms",
        handler: "platform.create",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "PUT",
        path: "/warehouses/:uuid/platforms/:locationUuid",
        handler: "platform.update",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "DELETE",
        path: "/warehouses/:uuid/platforms/:locationUuid",
        handler: "platform.delete",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};