module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/int-roles/:app",
        handler : "int-role.getAppPermissions",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method  : "GET",
        path    : "/int-roles/:app/:module",
        handler : "int-role.getModulePermissions",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}