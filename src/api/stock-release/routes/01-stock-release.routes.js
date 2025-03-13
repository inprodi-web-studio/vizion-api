module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/stock-releases",
        handler : "stock-release.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/stock-releases/:uuid/reserve",
        handler : "stock-release.reserveStock",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}