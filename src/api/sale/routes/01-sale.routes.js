module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/sales",
        handler : "sale.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/sales/stats",
        handler : "sale.getStats",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/sales/:uuid",
        handler : "sale.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/sales",
        handler : "sale.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/sales/:uuid",
        handler : "sale.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/sales/:uuid/authorize",
        handler : "sale.authorize",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/sales/:uuid",
        handler : "sale.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}