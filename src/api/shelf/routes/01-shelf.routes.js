module.exports = {
    routes : [
      {
        method  : "POST",
        path    : "/shelfs",
        handler : "shelf.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/shelfs/:uuid",
        handler : "shelf.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}