const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    completeName : yup.object().when( "tradeName", function(v) {
        if (v) {
            return yup.object().oneOf([null], "Either Complete Name or Trade Name must be provided, not both at the same time");
        } else {
            return yup.object().shape({
                name     : yup.string().required(),
                lastName : yup.string(),
                middleName : yup.string(),
            }).strict().required();
        }
    }),
    tradeName : yup.string().when( "completeName", function(v) {
        if (v) {
            return yup.string().oneOf([null], "Either Complete Name or Trade Name must be provided, not both at the same time");
        } else {
            return yup.string().required();
        }
    }),
    email : yup.string().email(),
    phone : yup.object().shape({
        code   : yup.string().required(),
        number : yup.string().required(),
    }).strict().nullable(),
    mainAddress : yup.object().shape({
        street    : yup.string(),
        extNumber : yup.string(),
        intNumber : yup.string(),
        suburb    : yup.string(),
        cp        : yup.string().min(5).max(5),
        city      : yup.string(),
        country   : yup.string(),
    }).strict().nullable(),
    fiscalInfo : yup.object().shape({
        legalName : yup.string(),
        rfc       : yup.string(),
        regime    : yup.string(),
        address : yup.object().shape({
            street    : yup.string(),
            extNumber : yup.string(),
            intNumber : yup.string(),
            suburb    : yup.string(),
            cp        : yup.string().min(5).max(5),
            city      : yup.string(),
            country   : yup.string(),
        }).strict().nullable(),
    }).strict().nullable(),
    responsible : yup.string().uuid(),
    rating      : yup.number().min(0).max(5).required(),
    group       : yup.string().uuid(),
    source      : yup.string().uuid(),
    tags        : yup.array().of( yup.string().uuid() ),
}, [["completeName", "tradeName"]]).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};