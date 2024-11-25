module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/products/:productUuid/badges",
        handler : "product-badge.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/variations/:variationUuid/badges",
        handler : "product-badge.find",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}