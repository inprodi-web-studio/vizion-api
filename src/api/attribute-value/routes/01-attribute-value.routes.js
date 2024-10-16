module.exports = {
    routes: [
      {
        method: "GET",
        path: "/products/:productUuid/attributes/:attributeUuid/values/:uuid/relations",
        handler: "attribute-value.findRelations",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/attribute-values",
        handler: "attribute-value.create",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/products/:productUuid/attributes/:attributeUuid/values",
        handler: "attribute-value.connectValue",
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
        path: "/products/:productUuid/attributes/:attributeUuid/values/:uuid",
        handler: "attribute-value.disconnectValue",
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