module.exports = {
    routes: [
      {
        method: "POST",
        path: "/phone-calls",
        handler: "phone-call.makeCall",
        config : {
          policies : ["global::userContext"],
        },
      },
    ],
};