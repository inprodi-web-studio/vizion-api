module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/contacts/customers/:uuid/credit-movements",
        handler : "credit-movement.find",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}