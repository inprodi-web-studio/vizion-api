const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    unity : yup.string().uuid().required(),
    conversionRate : yup.number().required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};