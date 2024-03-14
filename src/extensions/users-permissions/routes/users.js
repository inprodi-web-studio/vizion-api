module.exports = ( plugin ) => {
    plugin.routes["content-api"].routes.push({
        method  : "GET",
        path    : "/users/me",
        handler : "user.me",
        config  : {
            prefix : "",
        },
    });
}