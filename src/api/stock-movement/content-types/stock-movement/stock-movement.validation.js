const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createAdjustment = yup.array().of( yup.object().shape({
    product : yup.string().uuid().required(),
    badge : yup.object().shape({
        uuid : yup.string().uuid().nullable(),
        name : yup.string().nullable(),
        expirationDate : yup.string().nullable(),
    }).nullable(),
    variation : yup.string().uuid().nullable(),
    location : yup.string().uuid().required(),
    shelf : yup.string().uuid().nullable(),
    xPosition : yup.number().nullable(),
    yPosition : yup.number().nullable(),
    partition : yup.number().nullable(),
    quantity : yup.number().required(),
    package : yup.string().uuid().nullable(),
    motive : yup.string().uuid().required(),
    comments : yup.string().nullable(),
}).strict() ).min(1)

module.exports = {
    validateCreateAdjustment : validateYupSchema( createAdjustment ),
};