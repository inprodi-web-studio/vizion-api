const Facturapi = require("facturapi");
const facturapi = new Facturapi( process.env.FA_SECRET_KEY );

const regimes = require("../../../constants/regimes");

module.exports = {
    async findRegimes(ctx) {
        const { search } = ctx.query ?? {};

        return search ? regimes.filter( i => i.value.toLowerCase().includes( search.toLowerCase() ) || i.name.toLowerCase().includes( search.toLowerCase() ) ) : regimes;
    },

    async findUnities(ctx) {
        const { search, pagination } = ctx.query ?? {};

        const unities = await facturapi.catalogs.searchUnits({
            q     : search,
            limit : pagination?.pageSize ?? 30,
            page  : pagination?.page ?? 1,
        });

        return unities.data;
    },

    async findProductKeys(ctx) {
        const { search, pagination } = ctx.query ?? {};

        const productKeys = await facturapi.catalogs.searchProducts({
            q     : search,
            limit : pagination?.pageSize ?? 30,
            page  : pagination?.page ?? 1,
        });

        return productKeys.data;
    },
};