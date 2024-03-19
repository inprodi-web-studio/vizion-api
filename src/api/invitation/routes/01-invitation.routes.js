module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/invitations",
        handler : "invitation.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/invitations",
        handler : "invitation.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/invitations/:uuid",
        handler : "invitation.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}