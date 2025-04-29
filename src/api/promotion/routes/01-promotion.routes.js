module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/promotions",
        handler : "promotion.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/promotions/stats",
        handler : "promotion.getStats",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/promotions/:uuid",
        handler : "promotion.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/promotions",
        handler : "promotion.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/promotions/:uuid",
        handler : "promotion.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/promotions/:uuid",
        handler : "promotion.toggle",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/promotions/:uuid",
        handler : "promotion.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}