const {
    NotFoundError,
} = require("./errors");

async function findOneByAny( value, MODEL, field, schema, byCompany = false ) {
    const ctx = strapi.requestContext.get();

    const individualModel = MODEL.split(".")[1];

    const item = await strapi.entityService.findMany( MODEL, {
        filters : {
            [field] : value,
        },
        ...schema,
    });

    if ( item.length === 0 ) {
        throw new NotFoundError(`${ individualModel } with ${ field } of ${ value } not found`, {
            key  : `${ individualModel }.notFound`,
            path : ctx.request.path,
        });
    }

    return item[0];
}

module.exports = findOneByAny;