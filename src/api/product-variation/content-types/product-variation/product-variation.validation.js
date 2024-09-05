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
    saleInfo    : yup.object().shape({
        price        : yup.number().nullable(),
        iva          : yup.string().nullable(),
        deliveryTime : yup.number().nullable(),
    }).strict().nullable(),
    purchaseInfo : yup.object().shape({
        price : yup.number().nullable(),
        iva   : yup.string().nullable(),
    }).strict().nullable(),
    stockInfo : yup.object().shape({
        lowAlert      : yup.number().nullable(),
        alertTo       : yup.string().uuid().nullable(),
        minQuantity   : yup.number().nullable(),
        maxQuantity   : yup.number().nullable(),
        noStockPolicy : yup.string().oneOf(["none", "estimates", "both"]).nullable(),
    }).strict().nullable(),
    values : yup.array().of( yup.string().uuid() ).required(),
}).strict();

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
    saleInfo    : yup.object().shape({
        price        : yup.number().nullable(),
        iva          : yup.string().nullable(),
        deliveryTime : yup.number().nullable(),
    }).strict().nullable(),
    purchaseInfo : yup.object().shape({
        price : yup.number().nullable(),
        iva   : yup.string().nullable(),
    }).strict().nullable(),
    stockInfo : yup.object().shape({
        lowAlert      : yup.number().nullable(),
        alertTo       : yup.string().uuid().nullable(),
        minQuantity   : yup.number().nullable(),
        maxQuantity   : yup.number().nullable(),
        noStockPolicy : yup.string().oneOf(["none", "estimates", "both"]).nullable(),
    }).strict().nullable(),
});

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
    validateUpdate : validateYupSchema( updateSchema ),
};