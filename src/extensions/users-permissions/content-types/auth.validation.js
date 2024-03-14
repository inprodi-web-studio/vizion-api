const { yup, validateYupSchema } = require("../../../helpers/validators");

const loginSchema = yup.object().shape({
    email    : yup.string().email().required(),
    password : yup.string().required(),
});

const registerSchema = yup.object().shape({
    name     : yup.string().required(),
    lastName : yup.string().required(),
    email    : yup.string().email().required(),
    password : yup.string()
        .min(8)
        .matches(/[a-z]/, 'Password must have at least 1 lowercase letter')
        .matches(/[A-Z]/, 'Password must have at least 1 uppercase letter')
        .matches(/[0-9]/, 'Password must have at least 1 number')
        .required(),
}).strict();

const codeValidationSchema = yup.object().shape({
    event : yup.string().oneOf(["register", "reset"]).required(),
    code  : yup.string().min(4).required(),
}).strict();

module.exports = {
    validateLogin         : validateYupSchema( loginSchema ),
    validateRegister       : validateYupSchema( registerSchema ),
    validateCodeValidation : validateYupSchema( codeValidationSchema ),
};