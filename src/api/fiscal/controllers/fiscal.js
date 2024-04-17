const regimes = require("../../../constants/regimes");

module.exports = {
    async findRegimes(ctx) {
        const { search } = ctx.query ?? {};

        return search ? regimes.filter( i => i.value.toLowerCase().includes( search.toLowerCase() ) || i.name.toLowerCase().includes( search.toLowerCase() ) ) : regimes;
    },
};