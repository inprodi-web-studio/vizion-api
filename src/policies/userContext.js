const { USER } = require("../constants/models");
const { UnauthorizedError } = require("../helpers/errors");
const findOneByUuid = require("../helpers/findOneByUuid");

module.exports = async ( policyContext, config, { strapi } ) => {
    const ctx      = strapi.requestContext.get();
    const { uuid } = ctx.state.user;

    if ( !uuid ) return;

    const user = await findOneByUuid( uuid, USER, {
        populate : {
            intRole : true,
            company : true,
        },
    });

    if ( user.blocked ) {
        throw new UnauthorizedError( "The user has being blocked", {
            key : "user.blocked",
            path : ctx.request.path,
        });
    }

    if ( !user.company.isActive ) {
        throw new UnauthorizedError( "The company has being blocked", {
            key : "company.blocked",
            path : ctx.request.path,
        });
    }

    ctx.state.user    = user;
    ctx.state.company = user.company;
};