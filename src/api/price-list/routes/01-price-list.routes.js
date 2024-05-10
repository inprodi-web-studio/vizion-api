module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/price-lists",
        handler : "price-list.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/price-lists",
        handler : "price-list.create",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "PUT",
        path    : "/price-lists/:uuid",
        handler : "price-list.update",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/price-lists/:uuid",
        handler : "price-list.delete",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}