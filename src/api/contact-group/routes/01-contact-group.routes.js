module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/contacts/groups",
        handler : "contact-group.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/contacts/groups/:uuid",
        handler : "contact-group.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/contacts/groups",
        handler : "contact-group.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/contacts/groups/:uuid",
        handler : "contact-group.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/contacts/groups/:uuid",
        handler : "contact-group.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}