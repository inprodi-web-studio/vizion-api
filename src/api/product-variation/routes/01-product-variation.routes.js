module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/products/:productUuid/variations",
        handler : "product-variation.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/products/:productUuid/variations",
        handler : "product-variation.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/products/:productUuid/variations/:uuid",
        handler : "product-variation.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/products/:productUuid/variations/:uuid",
        handler : "product-variation.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}