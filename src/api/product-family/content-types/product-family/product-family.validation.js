const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name     : yup.string().required(),
    parentId : yup.string().uuid().nullable(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};
