const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    image : yup.number().nullable(),
    sku : yup.string().required(),
    description : yup.string().nullable(),
    dimensions  : yup.object().shape({
        weight : yup.number().nullable(),
        long   : yup.number().nullable(),
        width  : yup.number().nullable(),
        height : yup.number().nullable(),
    }).strict().nullable(),
    values : yup.array().of( yup.string().uuid() ).required(),
});

const updateSchema = yup.object().shape({
    image : yup.number().nullable(),
    sku : yup.string().required(),
    description : yup.string().nullable(),
    dimensions  : yup.object().shape({
        weight : yup.number().nullable(),
        long   : yup.number().nullable(),
        width  : yup.number().nullable(),
        height : yup.number().nullable(),
    }).strict().nullable(),
});

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
    validateUpdate : validateYupSchema( updateSchema ),
};