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
        method  : "PATCH",
        path    : "/users/me/profile-picture",
        handler : "user.setProfileImage",
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
        method  : "PUT",
        path    : "/users/me/profile",
        handler : "user.updateProfile",
        config  : {
            prefix : "",
        },
    });
    plugin.routes["content-api"].routes.push({
        method  : "PUT",
        path    : "/users/me/password",
        handler : "user.updatePassword",
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
        path    : "/users/me/profile-picture",
        handler : "user.removeProfileImage",
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