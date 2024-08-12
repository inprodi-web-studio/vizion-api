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
    ],
}