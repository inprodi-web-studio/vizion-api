const { INVOICE } = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const { createCoreController } = require("@strapi/strapi").factories;

const invoiceFields = {
  fields: ["uuid"],
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
          fields: ["uuid", "name", "abbreviation"],
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
}));
