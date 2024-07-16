const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    completeName : yup.object().when( "tradeName", function(v) {
        if (v) {
            return yup.object().oneOf([null], "Either Complete Name or Trade Name must be provided, not both at the same time");
        } else {
            return yup.object().shape({
                name     : yup.string().required(),
                lastName : yup.string().nullable(),
                middleName : yup.string().nullable(),
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
    email : yup.string().email().nullable(),
    phone : yup.object().shape({
        code   : yup.string().nullable(),
        number : yup.string().nullable(),
    }).strict().nullable(),
    website : yup.string().nullable(),
    cellphone : yup.object().shape({
        code   : yup.string().nullable(),
        number : yup.string().nullable(),
    }).strict().nullable(),
    mainAddress : yup.object().shape({
        street    : yup.string().nullable(),
        extNumber : yup.string().nullable(),
        intNumber : yup.string().nullable(),
        suburb    : yup.string().nullable(),
        cp        : yup.string().nullable().min(5).max(5),
        city      : yup.string().nullable(),
        state     : yup.string().nullable(),
        country   : yup.string().nullable(),
    }).strict().nullable(),
    responsible : yup.string().uuid().nullable(),
    rating      : yup.number().min(0).max(5).required(),
    group       : yup.string().uuid().nullable(),
    source      : yup.string().uuid().nullable(),
    tags        : yup.array().of( yup.string().uuid() ).nullable(),
}, [["completeName", "tradeName"]]).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};