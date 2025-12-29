const axios = require("axios");
const { INVOICE, COMPANY, CUSTOMER } = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const {
  validateCreate,
} = require("../content-types/invoice/invoice.validations");
const { BadRequestError } = require("../../../helpers/errors");

const { createCoreController } = require("@strapi/strapi").factories;

const invoiceFields = {
  fields: ["uuid", "context", "isCancelled", "fol", "date"],
  populate: {
    sale: {
      fields: ["uuid", "fol", "date", "subject"],
    },
    items: {
      fields: ["quantity", "price", "iva", "realQuantity", "comment"],
      populate: {
        product: {
          fields: ["uuid", "name", "sku", "description"],
          populate: {
            images: {
              fields: ["url"],
            },
            unity: {
              fields: ["uuid", "name", "satCode", "abbreviation"],
            },
            brand: {
              fields: ["uuid", "name"],
            },
            variations: {
              count: true,
            },
            packages: {
              count: true,
            },
            stockInfo: true,
            saleInfo: true,
          },
        },
        discount: true,
        package: {
          fields: ["uuid", "conversionRate", "realConversion"],
          populate: {
            unity: true,
          },
        },
        unity: {
          fields: ["uuid", "satCode", "name", "abbreviation"],
        },
        variation: {
          fields: ["uuid", "sku"],
          populate: {
            values: {
              fields: ["uuid", "name"],
              populate: {
                attribute: {
                  fields: ["uuid", "name"],
                },
              },
            },
          },
        },
      },
    },
    resume: true,
  },
};

module.exports = createCoreController(INVOICE, ({ strapi }) => ({
  async find(ctx) {
    const filters = {
      $search: ["sale.subject", "sale.fol", "sale.customer.finalName"],
    };

    const invoices = await findMany(INVOICE, invoiceFields, filters);

    return invoices;
  },

  async findOne(ctx) {
    const { uuid } = ctx.params;

    const invoice = await findOneByUuid(INVOICE, uuid, invoiceFields);

    return invoice;
  },

  async create(ctx) {
    const { company } = ctx.state;
    const data = ctx.request.body;

    await validateCreate(data);

    const companyObj = await findOneByUuid(COMPANY, company.uuid, {
      populate: {
        fiscalInfo: {
          populate: {
            address: true,
          },
        },
      },
    });

    const customerObj = await findOneByUuid(CUSTOMER, data.customer, {
      populate: {
        fiscalInfo: {
          populate: {
            address: true,
          },
        },
      },
    });

    if (!customerObj.fiscalInfo?.rfc) {
      throw new BadRequestError("Customer doesn't have a rfc", {
        key: "customer.missingRfc",
        path: ctx.request.path,
      });
    }

    if (!customerObj.fiscalInfo?.address?.cp) {
      throw new BadRequestError("Customer doesn't have a cp", {
        key: "customer.missingCp",
        path: ctx.request.path,
      });
    }

    if (!customerObj.fiscalInfo?.legalName) {
      throw new BadRequestError("Customer doesn't have a legal name", {
        key: "customer.missingLegalName",
        path: ctx.request.path,
      });
    }

    const parsedItems = [];

    for (const item of data.items) {
      if (!item.product.satCode) {
        throw new BadRequestError(
          `Product ${item.product.name} doesn't have a sat code`,
          {
            key: "product.missingSatCode",
            path: ctx.request.path,
          }
        );
      }

      if (!item.product.unity?.satCode) {
        throw new BadRequestError(
          `Product ${item.product.name} doesn't have a unity sat code`,
          {
            key: "product.missingUnitySatCode",
            path: ctx.request.path,
          }
        );
      }

      parsedItems.push({
        ProductCode: item.product.satCode.split("-")[0].trim(),
        UnitCode: item.product.unity.satCode.split("-")[0].trim(),
        Description: item.product.name,
        Quantity: item.quantity,
        UnitPrice: item.price,
        ...(item.iva &&
          item.iva > -1 && {
            Taxes: [
              {
                Name: "IVA",
                Rate: item.iva / 100,
                Total: (item.price * item.iva) / 100,
                IsRetention: false,
              },
            ],
          }),
      });
    }

    const payload = {
      Date: new Date().toISOString(),
      CfdiType: "I",
      ExpeditionPlace: companyObj.fiscalInfo?.address?.cp,
      Currency: "MXN",
      PaymentMethod: data.paymentMethod,
      PaymentForm: data.paymentForm,
      Receiver: {
        Rfc: customerObj.fiscalInfo?.rfc,
        CfdiUse: data.cfdiUse,
        Name: customerObj.fiscalInfo?.legalName,
        TaxZipCode: customerObj.fiscalInfo?.address?.cp,
      },
      Items: parsedItems,
    };

    const response = await axios
      .post("https://apisandbox.facturama.mx/3/cfdis", payload, {
        auth: {
          username: process.env.FACTURAMA_USERNAME,
          password: process.env.FACTURAMA_PASSWORD,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .catch((error) => {
        console.log(error);

        throw error;
      });

    console.log(response);

    return "success";
  },
}));
