const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    unity : yup.string().uuid().required(),
    conversionRate : yup.number().required(),
    referenceUnity : yup.string().uuid().nullable(),
    type : yup.string().oneOf(["sale", "stock"]).required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};