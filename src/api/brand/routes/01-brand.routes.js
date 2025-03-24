module.exports = {
    routes: [
      {
        method: "GET",
        path: "/brands",
        handler: "brand.find",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};