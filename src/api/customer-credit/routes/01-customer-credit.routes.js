module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/credit-lines/customers/:uuid",
        handler : "customer-credit.find",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}