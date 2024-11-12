const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name : yup.string().required(),
    address : yup.object().shape({
        street    : yup.string().required(),
        extNumber : yup.string().required(),
        intNumber : yup.string().nullable(),
        suburb    : yup.string().required(),
        cp        : yup.string().required().min(5).max(5),
        city      : yup.string().required(),
        state     : yup.string().required(),
        country   : yup.string().required(),
    }).strict().required(),
}).strict();

const updateLayoutSchema = yup.object().shape({
    layout : yup.array().of( yup.object() ).required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
    validateUpdateLayout : validateYupSchema( updateLayoutSchema ),
};