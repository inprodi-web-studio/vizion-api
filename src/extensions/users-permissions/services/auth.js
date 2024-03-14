const { USER } = require("../../../constants/models");
const { BadRequestError } = require("../../../helpers/errors");
const generateRandomCode = require("../../../helpers/generateRandomCode");
const validatePassword = require("../../../helpers/validatePassword");

module.exports = ( plugin ) => {
    plugin.services.validateUserContext = async (password, user) => {
        const ctx = strapi.requestContext.get();

        await validatePassword( password, user.password );

        if ( !user.confirmed ) {
            throw new BadRequestError( "User has not confirmed his email address.", {
                key : "auth.notConfirmed",
                path : ctx.request.path,
            });
        }

        if ( user.blocked ) {
            throw new BadRequestError( "User is blocked by his administrator.", {
                key : "auth.blocked",
                path : ctx.request.path,
            });
        }
    };

    plugin.services.sendVerificationCode = async ({ id, uuid, name, lastName, email }, event) => {
        const code = generateRandomCode( 4 );

        const emailConfig = event === "register" ? {
            subject : "¡Verifica tu Cuenta!",
            text    : `Correo de registro - ${ code }`,
            html    : `<p></p>`,
        } : {
            subject : "Restablece tu Contraseña",
            text    : `Correo de restablecimiento - ${ code }`,
            html    : `<p></p>`,
        };

        await strapi.plugins["email"].services.email.sendTemplatedEmail(
            {
                to : email,
            },
            emailConfig,
            {
                uuid,
                name,
                lastName,
                code,
            },
        );

        await strapi.entityService.update( USER, id, {
            data : {
                [ event === "register" ? "confirmationToken" : "resetPasswordToken" ] : code,
            },
        });

        return code;
    };

    plugin.services.validateCode = async ({ event, code }, user) => {
        const ctx = strapi.requestContext.get();

        const currentCode = event === "reset" ? user.resetPasswordToken : user.confirmationToken;

        if ( currentCode !== code ) {
            throw new BadRequestError("Wrong code", { key : "auth.wrongCode", path : ctx.request.url });
        }
    };
};