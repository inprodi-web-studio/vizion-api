module.exports = {
    routes : [
      {
        method  : "POST",
        path    : "/estimates",
        handler : "estimate.create",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}