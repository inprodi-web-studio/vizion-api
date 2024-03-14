const handleSearch = require("./handleSearch");

async function findMany( MODEL, schema, filters, byCompany = true ) {
    const ctx       = strapi.requestContext.get();
    const company   = ctx.state.company; 
    const { query } = ctx;

    const handledFilters = handleSearch( filters );

    const items = await strapi.service( MODEL ).find({
        ...query,
        ...schema,
        filters : {
            ...handledFilters,
            ...query.filters,
            ...( byCompany && {
                company : company.id
            })
        },
    });

    return items;
};

module.exports = findMany;