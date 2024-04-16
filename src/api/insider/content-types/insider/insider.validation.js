const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    completeName : yup.object().shape({
        name       : yup.string().required(),
        middleName : yup.string().nullable(),
        lastName   : yup.string().nullable(),
    }).required(),
    isPrimary : yup.boolean().required(),
    email     : yup.string().email().nullable(),
    job       : yup.string().nullable(),
    phone : yup.object().shape({
        code   : yup.string().nullable(),
        number : yup.string().nullable(),
    }).strict().nullable(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};