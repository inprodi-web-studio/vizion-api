const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name : yup.string().required(),
    xPositions : yup.number().required().min(1),
    yPositions : yup.number().required().min(1),
    location : yup.string().uuid().required(),
});

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};