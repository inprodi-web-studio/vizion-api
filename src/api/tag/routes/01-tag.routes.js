module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/contacts/tags",
        handler : "tag.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/contacts/tags",
        handler : "tag.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/contacts/tags/:uuid",
        handler : "tag.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/contacts/tags/:uuid",
        handler : "tag.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}