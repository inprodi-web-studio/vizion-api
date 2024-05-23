const { yup, validateYupSchema } = require("../../../helpers/validators");

const updateProfileSchema = yup.object().shape({
    name       : yup.string().required(),
    middleName : yup.string().required(),
    lastName   : yup.string().required(),
    phone      : yup.object().shape({
        code   : yup.string().required(),
        number : yup.string().required(),
    }).strict().nullable(),
}).strict();

const updatePasswordSchema = yup.object().shape({
    current : yup.string().required(),
    new     : yup.string().required(),
}).strict();

module.exports = {
    validateUpdateProfile : validateYupSchema( updateProfileSchema ),
    validateUpdatePassword : validateYupSchema( updatePasswordSchema ),
};