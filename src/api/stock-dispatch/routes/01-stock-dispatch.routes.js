module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/stock-dispatches",
        handler : "stock-dispatch.find",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}