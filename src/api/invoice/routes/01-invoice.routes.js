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
    {
      method: "POST",
      path: "/invoices",
      handler: "invoice.create",
      config: {
        policies: ["global::userContext"],
      },
    },
    {
      method: "POST",
      path: "/invoices/download/:format/:id",
      handler: "invoice.download",
      config: {
        policies: ["global::userContext"],
      },
    },
  ],
};
