module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/estimates",
        handler : "estimate.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/estimates/stats",
        handler : "estimate.getStats",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/estimates/:uuid",
        handler : "estimate.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/estimates",
        handler : "estimate.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/estimates/:uuid",
        handler : "estimate.newVersion",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/estimates/:uuid/:version/convert",
        handler : "estimate.convert",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/estimates/:uuid/:version/pdf",
        handler : "estimate.generatePdf",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/estimates/:uuid/:version",
        handler : "estimate.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/estimates/:uuid/:version/active",
        handler : "estimate.setActiveVersion",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/estimates/:uuid",
        handler : "estimate.keyUpdate",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/estimates/:uuid",
        handler : "estimate.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/estimates/:uuid/:version",
        handler : "estimate.removeVersion",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}