const {
    NotFoundError,
} = require("./errors");

async function findOneByUuid( uuid, MODEL, schema, byCompany = true ) {
    const ctx     = strapi.requestContext.get();
    const company = ctx.state.company;

    const individualModel = MODEL.split(".")[1];

    const item = await strapi.entityService.findMany( MODEL, {
        filters : {
            uuid,
            ...( (byCompany && company) && {
                company : company.id
            })
        },
        ...schema,
    });

    if ( item.length === 0 ) {
        throw new NotFoundError(`${ individualModel } with uuid ${ uuid } not found`, {
            key  : `${ individualModel }.notFound`,
            path : ctx.request.path,
        });
    }

    return item[0];
}

module.exports = findOneByUuid;