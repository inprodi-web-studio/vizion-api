const { yup, validateYupSchema } = require("../helpers/validators");

const keyUpdate = yup.object().shape({
    key   : yup.string().required(),
    value : yup.mixed().nullable(),
}).strict();

module.exports = {
    validateKeyUpdate : validateYupSchema( keyUpdate ),
};

