const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name  : yup.string().required(),
    attribute : yup.string().uuid(),
});

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};