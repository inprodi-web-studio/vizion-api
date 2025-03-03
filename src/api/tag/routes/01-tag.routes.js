module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/tags",
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
        method  : "GET",
        path    : "/product-tags",
        handler : "tag.find",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/product-tags",
        handler : "tag.create",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}