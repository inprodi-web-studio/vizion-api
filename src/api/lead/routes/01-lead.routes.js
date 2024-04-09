module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/contacts/leads",
        handler : "lead.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/contacts/leads/:uuid",
        handler : "lead.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/files/leads/:uuid",
        handler : "lead.getFiles",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/tasks/leads/:uuid",
        handler : "lead.getTasks",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/contacts/leads",
        handler : "lead.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/files/leads/:uuid",
        handler : "lead.uploadFile",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/tasks/leads/:uuid",
        handler : "lead.createTask",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/contacts/leads/:uuid",
        handler : "lead.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/tasks/leads/:uuid/:taskUuid",
        handler : "lead.updateTask",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/contacts/leads/:uuid",
        handler : "lead.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/contacts/leads/:uuid/toggle",
        handler : "lead.toggleStatus",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PATCH",
        path    : "/contacts/leads/:uuid",
        handler : "lead.keyUpdate",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/files/leads/:uuid/:documentUuid",
        handler : "lead.removeFile",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/tasks/leads/:uuid/:taskUuid",
        handler : "lead.deleteTask",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/contacts/leads/:uuid",
        handler : "lead.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}