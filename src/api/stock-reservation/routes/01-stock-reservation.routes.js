module.exports = {
  routes: [
    {
      method: "POST",
      path: "/stock-reservations/dispatch-preparation",
      handler: "stock-reservation.picking",
      config: {
        policies: ["global::userContext"],
      },
    },
  ],
};
