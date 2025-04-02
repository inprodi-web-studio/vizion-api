module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/dispatches",
        handler : "dispatch.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/dispatches/:uuid",
        handler : "dispatch.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/dispatches/:uuid/conclude",
        handler : "dispatch.conclude",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/dispatches",
        handler : "dispatch.create",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}