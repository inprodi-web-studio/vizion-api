const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name : yup.string().required(),
    allowEntrances : yup.boolean().required(),
    allowExits : yup.boolean().required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};