module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/contacts/customers",
        handler : "customer.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/contacts/customers/:uuid",
        handler : "customer.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/contacts/customers",
        handler : "customer.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/contacts/customers/:uuid",
        handler : "customer.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/contacts/customers/:uuid/toggle",
        handler : "customer.toggleStatus",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/contacts/customers/:uuid",
        handler : "customer.keyUpdate",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/contacts/customers/:uuid",
        handler : "customer.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}