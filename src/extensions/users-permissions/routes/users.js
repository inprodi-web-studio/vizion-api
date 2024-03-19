module.exports = ( plugin ) => {
    plugin.routes["content-api"].routes.push({
        method  : "GET",
        path    : "/users/me",
        handler : "user.me",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "GET",
        path    : "/users",
        handler : "user.find",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "PATCH",
        path    : "/users/:uuid/toggle",
        handler : "user.toggle",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "DELETE",
        path    : "/users/:uuid",
        handler : "user.destroy",
        config  : {
            prefix : "",
        },
    });
}