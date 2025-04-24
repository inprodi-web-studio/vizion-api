const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    name : yup.string().required(),
    description : yup.string().nullable(),
    startDate : yup.string().required(),
    endDate : yup.string().nullable(),
    autoApply : yup.boolean().required(),
    force : yup.boolean().required(),
    type : yup.string().oneOf(["individualDiscount", "globalDiscount", "gift"]).required(),
    productQuery : yup.array().of( yup.array().of( yup.object().shape({
        type : yup.string().required(),
        entities : yup.array().nullable(),
    }).noUnknown().strict().required() ).required().min(1) ).required().min(1),
    discount : yup.object().shape({
        type : yup.string().oneOf(["percent", "amount"]).required(),
        amount : yup.number().required(),
        visible : yup.boolean().required(),
    }).noUnknown().strict().required(),
    conditions : yup.array().of( yup.array().of( yup.object().shape({
        type : yup.string().nullable(),
        entities : yup.array().nullable(),
        config : yup.object().nullable(),
    }).noUnknown().strict().required() ).required() ).nullable()
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};