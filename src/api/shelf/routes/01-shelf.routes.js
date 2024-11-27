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
    ],
}