module.exports = {
    routes: [
      {
        method: "GET",
        path: "/fiscal/regimes",
        handler: "fiscal.findRegimes",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method: "GET",
        path: "/fiscal/unities",
        handler: "fiscal.findUnities",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method: "GET",
        path: "/fiscal/product-keys",
        handler: "fiscal.findProductKeys",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
};