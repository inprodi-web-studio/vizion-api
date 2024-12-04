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
}).strict() ).min(1);

const createReubication = yup.array().of( yup.object().shape({
    product : yup.string().uuid().required(),
    badge : yup.string().uuid().nullable(),
    variation : yup.string().uuid().nullable(),
    package : yup.string().uuid().nullable(),
    quantity : yup.number().min(0).required(),
    origin : yup.object().shape({
        location : yup.string().uuid().required(),
        shelf : yup.string().uuid(),
        xPosition : yup.number(),
        yPosition : yup.number(),
        partition : yup.number(),
    }).strict().required(),
    destination : yup.object().shape({
        location : yup.string().uuid().required(),
        shelf : yup.string().uuid(),
        xPosition : yup.number(),
        yPosition : yup.number(),
        partition : yup.number(),
    }).strict().required(),
}).strict() ).min(1);

module.exports = {
    validateCreateAdjustment : validateYupSchema( createAdjustment ),
    validateCreateReubication : validateYupSchema( createReubication ),
};