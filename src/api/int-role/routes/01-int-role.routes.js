module.exports = {
    routes : [
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