const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    isDraft     : yup.boolean().required(),
    images      : yup.array().of( yup.number() ).nullable(),
    type        : yup.string().oneOf([ "simple", "variable" ]).required(),
    name        : yup.string().required(),
    description : yup.string().nullable(),
    sku         : yup.string().nullable(),
    category    : yup.string().uuid().nullable(),
    dimensions  : yup.object().shape({
        weight : yup.number().nullable(),
        long   : yup.number().nullable(),
        width  : yup.number().nullable(),
        height : yup.number().nullable(),
    }).strict().nullable(),
    url         : yup.string().nullable(),
    satCode     : yup.string().nullable(),
    taxType     : yup.string().nullable(),
    saleInfo    : yup.object().shape({
        price        : yup.number().required(),
        iva          : yup.string().nullable(),
        deliveryTime : yup.number().nullable(),
        unity        : yup.string().nullable(),
        note         : yup.string().nullable(),
    }).strict().nullable(),
    purchaseInfo : yup.object().shape({
        price : yup.number().required(),
        iva   : yup.string().nullable(),
        unity : yup.string().nullable(),
        note  : yup.string().nullable(),
    }).strict().nullable(),
    stockInfo : yup.object().shape({
        lowAlert      : yup.number().nullable(),
        alertTo       : yup.string().uuid().nullable(),
        minQuantity   : yup.number().nullable(),
        maxQuantity   : yup.number().nullable(),
        noStockPolicy : yup.string().oneOf(["none", "estimates", "both"]).nullable(),
        hasBatches    : yup.boolean().required(),
        isPerishable  : yup.boolean().required(),
    }).strict().nullable(),
    attributes : yup.mixed().when( "type", {
        is   : "variable",
        then : yup.array().of( yup.object().shape({
            attribute : yup.string().uuid().required(),
            values    : yup.array().of( yup.string().uuid() ).required(),
        }).strict() ).required(),
        otherwise : yup.mixed().oneOf([null]).nullable(),
    }),
}).strict();

const setPricingSchema = yup.object().shape({
    type : yup.string().oneOf([ "fixed", "lists", "staggered" ]).required(),
    config : yup.mixed().when( "type", {
        is   : "fixed",
        then : yup.mixed().oneOf([null]).nullable(),
        otherwise : yup.mixed().when( "type", {
            is   : "lists",
            then : yup.object().required(),
            otherwise : yup.mixed().when( "type", {
                is : "staggered",
                then : yup.array().of( yup.object() ).required(),
            }),
        }),
    }),
}).strict();

const setUpsellsSchema = yup.array().of( yup.string().uuid() ).required();

module.exports = {
    validateCreate     : validateYupSchema( createSchema ),
    validateSetPricing : validateYupSchema( setPricingSchema ),
    validateSetUpsells : validateYupSchema( setUpsellsSchema ),
};