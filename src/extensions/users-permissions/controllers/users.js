const { USER }      = require("../../../constants/models");
const handleSearch  = require("../../../helpers/handleSearch");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { BadRequestError } = require("../../../helpers/errors");

const userFields = {
    fields : ["uuid", "name", "middleName", "lastName", "email", "blocked", "createdAt"],
    populate : {
        role : {
            fields : ["id", "name"],
        },
        company : {
            fields : ["uuid", "name", "isActive", "completedOnboarding", "urlParam"],
            populate : {
                logotype : {
                    fields : ["url"],
                },
            },
        },
        image : {
            fields : ["url"],
        },
    },
};

module.exports = ( plugin ) => {
    plugin.controllers.user["me"] = async (ctx) => {
        const { uuid } = ctx.state.user;

        const user = await findOneByUuid( uuid, USER, userFields );

        return user;
    };

    plugin.controllers.user["find"] = async (ctx) => {
        const user      = ctx.state.user;
        const { query } = ctx;

        const filters = {
            $search : [
                "email",
                "name",
                "lastName",
                "middleName",
            ],
        };

        const userObject = await findOneByUuid( user.uuid, USER, {
            populate : {
                company : true,
            },
        });

        const handledFilters = handleSearch( filters );

        const users = await strapi.entityService.findMany( USER, {
            ...query,
            ...userFields,
            ...handledFilters,
            filters : {
                ...handledFilters,
                ...query.filters,
                company : userObject.company.id,
            },
        });

        const usersCount = await strapi.entityService.count( USER, {
            ...query,
            ...userFields,
            ...handledFilters,
            filters : {
                ...handledFilters,
                ...query.filters,
                company : userObject.company.id,
            },
        });

        const page     = ctx.query.page || 1;
        const pageSize = ctx.query.pageSize || 30;

        return {
            results : users,
            pagination : {
                page,
                pageSize,
                pageCount : Math.ceil( usersCount / pageSize ),
                total     : usersCount,
            },
        };
    };

    plugin.controllers.user["toggle"] = async (ctx) => {
        const { uuid } = ctx.params;

        const user = await findOneByUuid( uuid, USER, {
            populate : {
                role : true,
            },
        });

        if ( user.role.name === "owner" ) {
            throw new BadRequestError( "The role of this user cannot be blocked.", {
                key : "users.untoggable",
                path : ctx.request.path,
            });
        }

        const updatedUser = await strapi.entityService.update( USER, user.id, {
            data : {
                blocked : !user.blocked,
            },
        });

        return updatedUser;
    };

    plugin.controllers.user["destroy"] = async (ctx) => {
        const { id : uuid } = ctx.params;

        const user = await findOneByUuid( uuid, USER, {
            populate : {
                role : true,
            },
        });

        if ( user.role.name === "owner" ) {
            throw new BadRequestError( "The role of this user cannot be deleted.", {
                key : "users.undeletable",
                path : ctx.request.path,
            });
        }

        const deletedUser = await strapi.entityService.delete( USER, user.id );

        return deletedUser;
    };
};