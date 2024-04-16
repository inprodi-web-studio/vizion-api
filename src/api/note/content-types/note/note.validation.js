const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    title       : yup.string().required(),
    content     : yup.string().nullable(),
    relation    : yup.string().oneOf(["lead", "customer"]),
    entity      : yup.string().uuid().required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};