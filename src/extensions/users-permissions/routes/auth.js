module.exports = ( plugin ) => {
    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/auth/login",
        handler : "auth.login",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/auth/login/:urlParam",
        handler : "auth.loginCompany",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/auth/register",
        handler : "auth.register",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/auth/verify-code/:uuid",
        handler : "auth.verifyCode",
        config  : {
            prefix : "",
        },
    });
}