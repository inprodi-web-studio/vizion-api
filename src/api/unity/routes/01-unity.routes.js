module.exports = {
    routes: [
      {
        method: "GET",
        path: "/unities",
        handler: "unity.find",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};