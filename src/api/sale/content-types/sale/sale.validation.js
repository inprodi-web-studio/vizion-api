const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    customer : yup.string().uuid().required(),
    deliveryAddress : yup.object().nullable(),
    date : yup.string().required(),
    deliveryTime : yup.number().nullable(),
    deliveryDate : yup.string().nullable(),
    responsible : yup.string().uuid().required(),
    paymentScheme : yup.string().oneOf(["anticipated", "on-deliver", "on-advance", "deferred", "credit"]).required(),
    priceList : yup.string().uuid().required(),
    warehouse : yup.string().uuid().nullable(),
    subject : yup.string().required(),
    items : yup.array().of( yup.object().shape({
        product : yup.string().uuid().required(),
        quantity : yup.number().required(),
        price : yup.number().required(),
        iva : yup.string().required(),
        package : yup.string().uuid().nullable(),
        variation : yup.string().uuid().nullable(),
        comment : yup.string().nullable(),
        discount : yup.object().shape({
            percent : yup.number().required(),
            amount : yup.number().required(),
        }).strict().nullable(),
    }).strict() ).required(),
    resume : yup.object().shape({
        subtotal : yup.number().required(),
        individualDiscounts : yup.number().nullable(),
        globalDiscount : yup.object().shape({
            percent : yup.number().required(),
            amount : yup.number().required(),
        }).strict().nullable(),
        taxes : yup.number().required(),
        shipping : yup.number().nullable(),
        total : yup.number().required(),
    }).strict().required(),
    comments : yup.string().nullable(),
    terms : yup.string().nullable(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};