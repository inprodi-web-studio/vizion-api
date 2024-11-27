const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name : yup.string().required(),
    xPositions : yup.number().required().min(1).max(20),
    yPositions : yup.number().required().min(1).max(20),
    location : yup.string().uuid().required(),
    coordinates : yup.array().of( yup.object().shape({
        xPosition : yup.number().required(),
        yPosition : yup.number().required(),
        rotation : yup.string().oneOf(["low", "medium", "high"]).required(),
        partitions : yup.number().min(1).max(10).required(),
    })).required(),
});

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};