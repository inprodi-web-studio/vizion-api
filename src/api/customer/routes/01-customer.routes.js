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
        method  : "GET",
        path    : "/insiders/customers/:uuid",
        handler : "customer.getInsiders",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/files/customers/:uuid",
        handler : "customer.getFiles",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/tasks/customers/:uuid",
        handler : "customer.getTasks",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/notes/customers/:uuid",
        handler : "customer.getNotes",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/interactions/customers/:uuid",
        handler : "customer.getInteractions",
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
        method  : "POST",
        path    : "/insiders/customers/:uuid",
        handler : "customer.createInsider",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/delivery-addresses/customers/:uuid",
        handler : "customer.createDeliveryAddress",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/files/customers/:uuid",
        handler : "customer.uploadFile",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/tasks/customers/:uuid",
        handler : "customer.createTask",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/notes/customers/:uuid",
        handler : "customer.createNote",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/interactions/customers/:uuid",
        handler : "customer.createInteraction",
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
        method  : "PUT",
        path    : "/insiders/customers/:uuid/:insiderUuid",
        handler : "customer.updateInsider",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/tasks/customers/:uuid/:taskUuid",
        handler : "customer.updateTask",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/notes/customers/:uuid/:noteUuid",
        handler : "customer.updateNote",
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
      {
        method  : "DELETE",
        path    : "/insiders/customers/:uuid/:insiderUuid",
        handler : "customer.deleteInsider",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/files/customers/:uuid/:documentUuid",
        handler : "customer.removeFile",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/tasks/customers/:uuid/:taskUuid",
        handler : "customer.deleteTask",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/notes/customers/:uuid/:noteUuid",
        handler : "customer.deleteNote",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/interactions/customers/:uuid/:interactionUuid",
        handler : "customer.deleteInteraction",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}