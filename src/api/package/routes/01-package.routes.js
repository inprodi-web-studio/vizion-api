module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/products/:productUuid/packages",
        handler : "package.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/products/:productUuid/packages",
        handler : "package.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/products/:productUuid/packages/:uuid",
        handler : "package.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/products/:productUuid/packages/:uuid",
        handler : "package.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}