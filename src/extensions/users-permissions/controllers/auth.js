const userSession = require("../../../api/user-session/controllers/user-session");
const { USER } = require("../../../constants/models");
const checkForDuplicates = require("../../../helpers/checkForDuplicates");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");
const findOneByAny = require("../../../helpers/findOneByAny");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const generateToken = require("../../../helpers/generateToken");
const { validateRegister, validateCodeValidation, validateLogin } = require("../content-types/auth.validation");

const userFields = {
    fields : ["uuid", "name", "middleName", "lastName", "email", "blocked", "confirmed", "password", "createdAt"],
    populate : {
        role : {
            fields : ["id", "name"],
        },
        company : {
            fields : ["uuid", "name", "isActive", "primaryColor", "completedOnboarding", "urlParam", "applications"],
            populate : {
                logotype : {
                    fields : ["url"],
                },
            },
        },
        phone : true,
        image : {
            fields : ["url"],
        },
    },
};

module.exports = ( plugin ) => {
    plugin.controllers.auth["login"] = async (ctx) => {
        const data = ctx.request.body;

        await validateLogin( data );

        const {
            email,
            password,
        } = data;

        const user = await findOneByAny( email, USER, "email", userFields );

        await plugin.services.validateUserContext(password, user);

        const TOKEN = generateToken({
            id : user.id,
        });

        delete user.password;

        ctx.cookies.set("token", TOKEN, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return {
            token : TOKEN,
            user,
        };
    };

    plugin.controllers.auth["loginCompany"] = async (ctx) => {
        const data = ctx.request.body;
        const { urlParam } = ctx.params;

        await validateLogin( data );

        const {
            email,
            password,
        } = data;

        const query = await strapi.entityService.findMany( USER, {
            filters : {
                email,
                company : {
                    urlParam,
                },
            },
            ...userFields,
        });

        if ( query.length === 0 ) {
            throw new NotFoundError( "User in company not found", {
                key : "auth.userNotFoundInCompany",
                path : ctx.request.url,
            });
        }

        const user = query[0];

        await plugin.services.validateUserContext(password, user);

        const TOKEN = generateToken({
            id : user.id,
        });

        delete user.password;

        return {
            token : TOKEN,
            user,
        };
    };

    plugin.controllers.auth["register"] = async (ctx) => {
        const data = ctx.request.body;

        await validateRegister( data );

        const {
            email,
        } = data;

        await checkForDuplicates(
            USER,
            [
                { email },
            ],
        );

        const newUser = await strapi.entityService.create( USER, {
            data : {
                ...data,
                username  : data.email,
                confirmed : false,
            },
            fields : ["uuid", "name", "lastName", "email"],
        });

        const code = await plugin.services.sendVerificationCode( newUser, "register" );

        return newUser;
    };

    plugin.controllers.auth["verifyCode"] = async (ctx) => {
        const data     = ctx.request.body;
        const { uuid } = ctx.params;

        await validateCodeValidation( data );

        const { event } = data;

        const user = await findOneByUuid( uuid, USER );

        if ( event === "register" && user.confirmed ) {
            throw new BadRequestError("User already confirmed", {
                key : "auth.alreadyConfirmed",
                path : ctx.request.path,
            });
        }

        await plugin.services.validateCode( data, user );

        await strapi.entityService.update( USER, user.id, {
            data : {
                confirmationToken  : null,
                resetPasswordToken : null,
                ...( event === "register" && {
                    confirmed : true
                }),
            }
        });

        const TOKEN = generateToken({
            id : user.id,
        });

        return {
            token : TOKEN,
        };
    };
};