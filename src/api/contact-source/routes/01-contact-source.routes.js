module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/contacts/sources",
        handler : "contact-source.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/contacts/sources",
        handler : "contact-source.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/contacts/sources/:uuid",
        handler : "contact-source.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/contacts/sources/:uuid",
        handler : "contact-source.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}