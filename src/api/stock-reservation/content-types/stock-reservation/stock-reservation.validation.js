const { yup, validateYupSchema } = require('../../../../helpers/validators');

const moveToDispatchLocationSchema = yup.object().shape({
    reservation : yup.string().uuid().required(),
    location : yup.string().uuid().required(),
}).noUnknown().strict();

module.exports = {
    validateMoveToDispatchLocation : validateYupSchema( moveToDispatchLocationSchema ),
};
