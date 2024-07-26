const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name      : yup.string().required(),
    potential : yup.number().min(-1).max(100).required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};