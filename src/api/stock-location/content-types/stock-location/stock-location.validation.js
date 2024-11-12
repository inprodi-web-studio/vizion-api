const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name : yup.string().required(),
    identifier : yup.string().required(),
    allowDeliveries : yup.boolean().required(),
    allowDispatches : yup.boolean().required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};