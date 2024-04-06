const { UnauthorizedError } = require("./errors");
const findOneByUuid = require("./findOneByUuid");

const validateEntityPermission = async ( uuid, MODEL, schema = {} ) => {
    const ctx  = strapi.requestContext.get();
    const user = ctx.state.user;

    const entity = await findOneByUuid( uuid, MODEL, {
        ...( !schema?.fields ? ({
            fields : "*",
        }) : ({
            fields : schema.fields,
        })),
        ...( (!schema?.populate?.responsible) ? ({
            populate : {
                responsible : true,
                ...schema.populate,
            },
        }) : ({
            populate : schema.populate,
        })),
    });

    if ( user.role.name === "sales-agent" && entity.responsible.uuid !== user.uuid ) {
        throw new UnauthorizedError( `This user does't have permissions to see this entity`, {
            key  : `entity.notEnoughPermissions`,
            path : ctx.request.url,
        });
    }

    return entity;
};

module.exports = validateEntityPermission;