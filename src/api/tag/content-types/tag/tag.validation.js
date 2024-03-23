const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name  : yup.string().required(),
});

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};