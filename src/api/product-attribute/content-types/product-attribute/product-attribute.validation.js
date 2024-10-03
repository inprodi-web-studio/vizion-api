const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name  : yup.string().required(),
}).strict();

const connectSchema = yup.object().shape({
    attribute : yup.string().uuid().required(),
    values   : yup.array().of( yup.string().uuid() ).required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
    validateConnect : validateYupSchema( connectSchema ),
};