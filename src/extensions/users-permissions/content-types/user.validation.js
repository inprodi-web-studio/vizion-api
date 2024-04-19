const { yup, validateYupSchema } = require("../../../helpers/validators");

const updateProfileSchema = yup.object().shape({
    name       : yup.string().required(),
    middleName : yup.string().nullable(),
    lastName   : yup.string().nullable(),
    phone      : {
        code   : yup.string().nullable(),
        number : yup.string().nullable(),
    },
}).strict();

const updatePasswordSchema = yup.object().shape({
    current : yup.string().required(),
    new     : yup.string().required(),
}).strict();

module.exports = {
    validateUpdateProfile : validateYupSchema( updateProfileSchema ),
    validateUpdatePassword : validateYupSchema( updatePasswordSchema ),
};