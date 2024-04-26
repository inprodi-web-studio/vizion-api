module.exports = {
    routes : [
      {
        method  : "POST",
        path    : "/products",
        handler : "product.create",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}