const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name  : yup.string().required(),
    icon  : yup.string().nullable(),
});

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};