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
        method  : "GET",
        path    : "/products/:productUuid/variations/:uuid/relations",
        handler : "product-variation.findRelations",
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
        path    : "/products/:productUuid/variations/:uuid/pricing",
        handler : "product-variation.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/products/:productUuid/variations/:uuid",
        handler : "product-variation.setPricing",
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