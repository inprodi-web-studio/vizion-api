const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
    type     : yup.string().oneOf(["email", "videocall", "whatsapp", "phone", "sms", "meeting", "negotiation"]).required(),
    content  : yup.string().nullable(),
    relation : yup.string().oneOf(["lead", "customer"]),
    entity   : yup.string().uuid().required(),
}).strict();

module.exports = {
    validateCreate : validateYupSchema( createSchema ),
};