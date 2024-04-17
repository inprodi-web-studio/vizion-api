module.exports = {
    routes: [
      {
        method: "GET",
        path: "/fiscal/regimes",
        handler: "fiscal.findRegimes",
      },
    ],
};