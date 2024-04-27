module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/products",
        handler : "product.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/products",
        handler : "product.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/products/:uuid",
        handler : "product.keyUpdate",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}