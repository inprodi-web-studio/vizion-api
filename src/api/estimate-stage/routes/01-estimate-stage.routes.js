module.exports = {
    routes: [
      {
        method: "GET",
        path: "/estimate-stages",
        handler: "estimate-stage.find",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/estimate-stages",
        handler: "estimate-stage.create",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "PUT",
        path: "/estimate-stages/:uuid",
        handler: "estimate-stage.update",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "DELETE",
        path: "/estimate-stages/:uuid",
        handler: "estimate-stage.delete",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};