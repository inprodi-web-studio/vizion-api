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
        method  : "POST",
        path    : "/dispatches",
        handler : "dispatch.create",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}