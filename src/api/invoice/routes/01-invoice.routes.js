module.exports = {
  routes: [
    {
      method: "GET",
      path: "/invoices",
      handler: "invoice.find",
      config: {
        policies: ["global::userContext"],
      },
    },
    {
      method: "GET",
      path: "/invoices/:uuid",
      handler: "invoice.findOne",
      config: {
        policies: ["global::userContext"],
      },
    },
  ],
};
