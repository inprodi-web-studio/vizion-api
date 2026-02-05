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
        method  : "GET",
        path    : "/products/:uuid",
        handler : "product.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/files/products/:uuid",
        handler : "product.getFiles",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/products/:uuid/relations",
        handler : "product.findEstimatesAndSales",
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
        method  : "POST",
        path    : "/files/products/:uuid",
        handler : "product.uploadFile",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/products/export",
        handler : "product.export",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/products/:uuid",
        handler : "product.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/files/products/:uuid/:documentUuid",
        handler : "product.updateFileName",
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
      {
        method  : "PATCH",
        path    : "/products/:uuid/toggle",
        handler : "product.toggleStatus",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/products/:uuid/pricing",
        handler : "product.setPricing",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/products/:uuid/upsells",
        handler : "product.setUpsells",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/products/:uuid",
        handler : "product.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/files/products/:uuid/:documentUuid",
        handler : "product.removeFile",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}
