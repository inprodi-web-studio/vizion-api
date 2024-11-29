module.exports = {
    routes: [
      {
        method: "POST",
        path: "/stock-movements/adjustment",
        handler: "stock-movement.createAdjustment",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/stock-movements/relocation",
        handler: "stock-movement.createRelocation",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};