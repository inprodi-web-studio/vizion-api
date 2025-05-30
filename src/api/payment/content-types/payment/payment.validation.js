const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    amount : yup.number().required(),
    date   : yup.string().required(),
    paymentMethod : yup.string().required(),
    comments : yup.string().nullable(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};