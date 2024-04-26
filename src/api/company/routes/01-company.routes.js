module.exports = {
    routes : [
      {
        method  : "PATCH",
        path    : "/company/logotype",
        handler : "company.setLogotype",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "DELETE",
        path    : "/company/logotype",
        handler : "company.removeLogotype",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}