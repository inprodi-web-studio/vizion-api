const { yup, validateYupSchema } = require("../../../../helpers/validators");

const reserveSchema = yup.object().shape({
    quantity : yup.number().min(0).required(),
}).noUnknown().strict();

module.exports = {
    validateReserve : validateYupSchema( reserveSchema ),
};