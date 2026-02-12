module.exports = {
  routes: [
    {
      method: "GET",
      path: "/stock-reservations/pickings",
      handler: "stock-reservation.findPicked",
      config: {
        policies: ["global::userContext"],
      },
    },
    {
      method: "POST",
      path: "/stock-reservations/dispatch-preparation",
      handler: "stock-reservation.picking",
      config: {
        policies: ["global::userContext"],
      },
    },
    {
      method: "POST",
      path: "/stock-reservations/:uuid/output",
      handler: "stock-reservation.output",
      config: {
        policies: ["global::userContext"],
      },
    },
  ],
};
