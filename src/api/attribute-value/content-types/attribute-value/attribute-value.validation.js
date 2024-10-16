const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name  : yup.string().required(),
    attribute : yup.string().uuid(),
});

const connectSchema = yup.object().shape({
    value : yup.string().uuid().required(),
});

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
    validateConnect : validateYupSchema( connectSchema )
};