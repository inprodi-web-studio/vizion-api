module.exports = {
    routes : [
      {
        method  : "GET",
        path    : "/preferences/:app/:module",
        handler : "preference.findByModule",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
}