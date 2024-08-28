module.exports = {
    routes: [
      {
        method: "POST",
        path: "/attribute-values",
        handler: "attribute-value.create",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "PUT",
        path: "/attribute-values/:uuid",
        handler: "attribute-value.update",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "DELETE",
        path: "/attribute-values/:uuid",
        handler: "attribute-value.delete",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};