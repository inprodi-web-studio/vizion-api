module.exports = {
    routes: [
      {
        method: "GET",
        path: "/payments",
        handler: "payment.find",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "POST",
        path: "/sales/:uuid/payments",
        handler: "payment.create",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method  : "POST",
        path    : "/sales/:uuid/payments/:paymentUuid/pdf",
        handler : "payment.generatePdf",
        config : {
          policies : ["global::userContext"],
        },
      },
      {
        method: "PUT",
        path: "/sales/:uuid/payments/:paymentUuid",
        handler: "payment.update",
        config: {
          policies: ["global::userContext"],
        },
      },
      {
        method: "DELETE",
        path: "/sales/:uuid/payments/:paymentUuid",
        handler: "payment.delete",
        config: {
          policies: ["global::userContext"],
        },
      },
    ],
};