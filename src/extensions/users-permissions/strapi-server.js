const authRoutes      = require("./routes/auth");
const userRoutes      = require("./routes/users");
const authServices    = require("./services/auth");
const userServices    = require("./services/users");
const authControllers = require("./controllers/auth");
const userControllers = require("./controllers/users");

module.exports = ( plugin ) => {
    authRoutes(plugin);
    userRoutes(plugin);

    authServices(plugin);
    userServices(plugin);

    authControllers(plugin);
    userControllers(plugin);

    return plugin;
};