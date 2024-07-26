module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/companies/me",
        handler : "company.findOne",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/companies/:urlParam",
        handler : "company.findByUrlParam",
      },
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