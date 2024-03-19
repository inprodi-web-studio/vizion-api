const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name     : yup.string().required(),
    lastName : yup.string().required(),
    email    : yup.string().email().required(),
    role     : yup.string().required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};