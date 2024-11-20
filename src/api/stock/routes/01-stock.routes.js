module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/warehouses/:uuid/stock-locations/:locationUuid/stocks",
        handler : "stock.find",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}