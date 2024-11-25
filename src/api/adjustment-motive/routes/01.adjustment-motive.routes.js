module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/adjustment-motives",
        handler : "adjustment-motive.find",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}