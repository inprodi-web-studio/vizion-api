const { USER } = require("../../../constants/models");
const findOneByUuid = require("../../../helpers/findOneByUuid");

module.exports = ( plugin ) => {
    plugin.controllers.user["me"] = async (ctx) => {
        const { uuid } = ctx.state.user;

        const user = await findOneByUuid( uuid, USER, {
            fields : ["uuid", "name", "middleName", "lastName", "email", "blocked"],
            populate : {
                role : {
                    fields : ["id", "name"],
                },
                company : {
                    fields : ["uuid", "name", "isActive", "completedOnboarding"],
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
        });

        return user;
    };
};