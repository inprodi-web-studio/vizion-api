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
    ],
};