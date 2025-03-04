module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/shelves/:uuid/positions",
        handler : "shelf-position.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}