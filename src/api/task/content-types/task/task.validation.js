const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    title       : yup.string().required(),
    description : yup.string().nullable(),
    dueDate     : yup.string().required(),
    relation    : yup.string().oneOf(["lead", "customer"]),
    entity      : yup.string().uuid().required(),
    responsible : yup.string().uuid().required(),
    reminders   : yup.array().of( yup.string() ).nullable(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};