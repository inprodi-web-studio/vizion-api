const { yup, validateYupSchema } = require("../../../../helpers/validators");

const createSchema = yup.object().shape({
  paymentMethod: yup.string().required(),
  paymentForm: yup.string().required(),
  cfdiUse: yup.string().required(),
  customer: yup.string().required(),
  items: yup
    .array()
    .of(
      yup
        .object()
        .shape({
          product: yup.object(),
          quantity: yup.number().required(),
          price: yup.number().required(),
          iva: yup.string().required(),
          package: yup.object().nullable(),
          variation: yup.object().nullable(),
        })
        .strict()
    )
    .required(),
  resume: yup
    .object()
    .shape({
      subtotal: yup.number().required(),
      individualDiscounts: yup.number().nullable(),
      globalDiscount: yup
        .object()
        .shape({
          percent: yup.number().required(),
          amount: yup.number().required(),
        })
        .strict()
        .nullable(),
      taxes: yup.number().required(),
      shipping: yup.number().nullable(),
      total: yup.number().required(),
    })
    .strict()
    .required(),
});

module.exports = {
  validateCreate: validateYupSchema(createSchema),
};
