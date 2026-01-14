const axios = require("axios");
const {
  INVOICE,
  COMPANY,
  CUSTOMER,
  SALE,
} = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const {
  validateCreate,
  validateComplement,
} = require("../content-types/invoice/invoice.validations");
const { BadRequestError } = require("../../../helpers/errors");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const { createCoreController } = require("@strapi/strapi").factories;

const invoiceFields = {
  fields: ["uuid", "context", "isCancelled", "fol", "date", "createdAt"],
  populate: {
    sale: {
      fields: ["uuid", "fol", "date", "subject"],
      populate: {
        fields: ["finalName"],
        customer: {
          fields: ["uuid", "finalName", "isArchived"],
          populate: {
            fiscalInfo: {
              fields: ["legalName", "rfc", "regime"],
              populate: {
                address: true,
              },
            },
            deliveryAddresses: {
              fields: ["name", "isMain"],
              populate: {
                address: true,
              },
            },
          },
        },
      },
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
    const { company, user } = ctx.state;
    const data = ctx.request.body;

    await validateCreate(data);

    const companyObj = await findOneByUuid(company.uuid, COMPANY, {
      populate: {
        fiscalInfo: {
          populate: {
            address: true,
          },
        },
      },
    });

    if (!data.customer.fiscalInfo?.rfc) {
      throw new BadRequestError("Customer doesn't have a rfc", {
        key: "customer.missingRfc",
        path: ctx.request.path,
      });
    }

    if (!data.customer.fiscalInfo?.address?.cp) {
      throw new BadRequestError("Customer doesn't have a cp", {
        key: "customer.missingCp",
        path: ctx.request.path,
      });
    }

    if (!data.customer.fiscalInfo?.legalName) {
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

      const subtotal = item.price * item.quantity;

      let taxObject = "01";
      let taxes = [];
      let total = subtotal;

      if (item.iva && item.iva > -1) {
        taxObject = "02";

        const rate = item.iva / 100;
        const taxAmount = subtotal * rate;

        taxes.push({
          Name: "IVA",
          Rate: rate,
          Base: Number(subtotal.toFixed(6)),
          Total: Number(taxAmount.toFixed(6)),
          IsRetention: false,
        });

        total = subtotal + taxAmount;
      }

      parsedItems.push({
        ProductCode: item.product.satCode.split("-")[0].trim(),
        UnitCode: item.product.unity.satCode.split("-")[0].trim(),
        Description: item.product.name,
        Quantity: item.quantity,
        UnitPrice: item.price,
        Subtotal: Number(subtotal.toFixed(6)),
        Total: Number(total.toFixed(6)),
        TaxObject: taxObject,
        ...(taxes.length && { Taxes: taxes }),
      });
    }

    const payload = {
      Date: dayjs().tz("America/Mexico_City").format(),
      CfdiType: "I",
      ExpeditionPlace: companyObj.fiscalInfo?.address?.cp,
      Currency: "MXN",
      PaymentMethod: data.paymentMethod,
      PaymentForm: data.paymentForm,
      Receiver: {
        Rfc: data.customer.fiscalInfo?.rfc
          ?.toUpperCase()
          .replace(/\s+/g, "")
          .replace(/[^A-Z0-9]/g, ""),
        CfdiUse: data.cfdiUse,
        Name: data.customer.fiscalInfo?.legalName,
        TaxZipCode: data.customer.fiscalInfo?.address?.cp,
        FiscalRegime: data.customer.fiscalInfo?.regime,
      },
      Items: parsedItems,
    };

    const response = await axios
      .post("https://apisandbox.facturama.mx/3/cfdis", payload, {
        auth: {
          username: company.sc?.fm?.u,
          password: company.sc?.fm?.p,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .catch((error) => {
        console.log(error.response.data);

        throw error;
      });

    const sale = await findOneByUuid(data.sale, SALE);

    const intInvoice = await strapi.entityService.create(INVOICE, {
      data: {
        sale: sale.id,
        items: data.items,
        isCancelled: false,
        resume: data.resume,
        fol: response.data.Folio,
        date: new Date(),
        author: user.id,
        context: {
          ...response.data,
        },
      },
      ...invoiceFields,
    });

    return intInvoice;
  },

  async complement(ctx) {
    const { id } = ctx.params;
    const { company, user } = ctx.state;

    const data = ctx.request.body;

    await validateComplement(data);

    const invoice = await strapi.query(INVOICE).findOne({
      where: {
        context: {
          $contains: id,
        },
      },
      populate: {
        sale: {
          populate: {
            customer: {
              populate: {
                fiscalInfo: {
                  populate: {
                    address: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(invoice);

    if (!invoice) {
      throw new BadRequestError(`Invoice with uuid not found`, {
        key: "invoice.notFound",
        path: ctx.request.path,
      });
    }

    const companyObj = await findOneByUuid(company.uuid, COMPANY, {
      populate: {
        fiscalInfo: {
          populate: {
            address: true,
          },
        },
      },
    });

    const payload = {
      Date: dayjs(data.date)
        .tz("America/Mexico_City")
        .format("YYYY-MM-DDTHH:mm:ss"),
      CfdiType: "P",
      ExpeditionPlace: companyObj.fiscalInfo?.address?.cp,
      Receiver: {
        Rfc: invoice.sale.customer.fiscalInfo?.rfc
          .toUpperCase()
          .replace(/\s+/g, "")
          .replace(/[^A-Z0-9]/g, ""),
        CfdiUse: "CP01",
        Name: invoice.sale.customer.fiscalInfo?.legalName,
        TaxZipCode: invoice.sale.customer.fiscalInfo?.address?.cp,
        FiscalRegime: invoice.sale.customer.fiscalInfo?.regime,
      },
      Complemento: {
        Payments: [
          {
            Date: dayjs(data.date)
              .tz("America/Mexico_City")
              .format("YYYY-MM-DDTHH:mm:ss"),
            PaymentForm: data.paymentForm,
            Currency: "MXN",
            Amount: data.amount,
            OutstandingBalanceAmount: data.outstandingBalance,
            RelatedDocuments: [
              {
                TaxObject: "01",
                Uuid: invoice.context.Complement.TaxStamp.Uuid,
                AmountPaid: data.amount,
                PartialityNumber: 1, // CALCULAR
                PreviousBalanceAmount: 71775, // CALCULAR
                OutstandingBalanceAmount: 71775, // CALCULAR
              },
            ],
          },
        ],
      },
    };

    console.log(payload);
    console.log(payload.Complemento.Payments[0]);

    const response = await axios
      .post("https://apisandbox.facturama.mx/3/cfdis", payload, {
        auth: {
          username: company.sc.fm.u,
          password: company.sc.fm.p,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .catch((error) => {
        console.log(error.response.data);

        throw error;
      });

    return response;
  },

  async download(ctx) {
    const { format, id } = ctx.params;
    const { company } = ctx.state;

    if (!["pdf", "xml"].includes(format)) {
      ctx.throw(400, "Invalid format");
    }

    const response = await axios.get(
      `https://apisandbox.facturama.mx/cfdi/${format}/issued/${id}`,
      {
        auth: {
          username: company.sc?.fm?.u,
          password: company.sc?.fm?.p,
        },
      }
    );

    const { ContentEncoding, ContentType, Content } = response.data;

    if (ContentEncoding !== "base64") {
      ctx.throw(500, "Unsupported encoding");
    }

    const buffer = Buffer.from(Content, "base64");

    ctx.set(
      "Content-Type",
      ContentType === "pdf" ? "application/pdf" : "application/xml"
    );

    return buffer;
  },

  async cancel(ctx) {},
}));
