module.exports = {
    routes: [
      {
        method: "GET",
        path: "/product-categories",
        handler: "product-category.find",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/product-categories",
        handler: "product-category.create",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "PUT",
        path: "/product-categories/:uuid",
        handler: "product-category.update",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "DELETE",
        path: "/product-categories/:uuid",
        handler: "product-category.delete",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};