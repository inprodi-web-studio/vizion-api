module.exports = {
    routes: [
      {
        method: "GET",
        path: "/product-attributes",
        handler: "product-attribute.find",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/product-attributes",
        handler: "product-attribute.create",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "PUT",
        path: "/product-attributes/:uuid",
        handler: "product-attribute.update",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "DELETE",
        path: "/product-attributes/:uuid",
        handler: "product-attribute.delete",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};