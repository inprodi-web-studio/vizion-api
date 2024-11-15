const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createAdjustment = yup.array().of( yup.object().shape({
    product : yup.string().uuid().required(),
    location : yup.string().uuid().required(),
    quantity : yup.number().required(),
    motive : yup.string().uuid().required(),
    comments : yup.string().nullable(),
}).strict() ).min(1)

module.exports = {
    validateCreateAdjustment : validateYupSchema( createAdjustment ),
};