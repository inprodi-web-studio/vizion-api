const { auth } = require("strapi-provider-upload-do");
const {
  SALE,
  PREFERENCE,
  STOCK_RELEASE,
  COMPANY,
} = require("../../../constants/models");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateCreate } = require("../content-types/sale/sale.validation");
const { BadRequestError } = require("../../../helpers/errors");
const { default: puppeteer } = require("puppeteer");
const defaultSale = require("../../../templates/defaultSale.template");

const { createCoreController } = require("@strapi/strapi").factories;

const saleFields = {
  fields: [
    "uuid",
    "fol",
    "invoiceFol",
    "deliveryDate",
    "deliveryTime",
    "date",
    "paymentScheme",
    "subject",
    "comments",
    "terms",
    "isAuthorized",
    "isCancelled",
    "cancelledAt",
    "authorizedAt",
    "createdAt",
  ],
  populate: {
    responsible: {
      fields: ["uuid", "name", "middleName", "lastName"],
      populate: {
        image: {
          fields: ["url"],
        },
      },
    },
    customer: {
      fields: ["uuid", "finalName", "isArchived"],
      populate: {
        credit: true,
        mainAddress: true,
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
    deliveryAddress: {
      fields: ["name", "isMain"],
      populate: {
        address: true,
      },
    },
    priceList: {
      fields: ["uuid", "name"],
    },
    items: {
      fields: ["quantity", "price", "iva", "realQuantity", "comment"],
      populate: {
        product: {
          fields: ["uuid", "satCode", "name", "sku", "description"],
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
    resume: {
      fields: ["subtotal", "individualDiscounts", "taxes", "shipping", "total"],
      populate: {
        globalDiscount: true,
      },
    },
    estimate: {
      fields: ["uuid", "fol"],
      populate: {
        saleMeta: true,
        versions: {
          fields: ["subject", "fol", "isActive"],
        },
      },
    },
    payments: {
      fields: [
        "uuid",
        "amount",
        "date",
        "status",
        "fol",
        "paymentMethod",
        "comments",
      ],
    },
    invoices: {
      fields: ["uuid", "context", "isCancelled", "fol", "date"],
      populate: {
        items: {
          fields: ["quantity", "price", "iva", "realQuantity", "comment"],
          populate: {
            product: {
              fields: ["uuid", "satCode", "name", "sku", "description"],
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
        resume: true,
        invoice: {
          fields: ["uuid"],
        },
      },
    },
    warehouse: {
      fields: ["uuid", "name"],
    },
  },
};

module.exports = createCoreController(SALE, ({ strapi }) => ({
  async find(ctx) {
    const filters = {
      $search: ["fol", "customer.finalName", "subject"],
    };

    const sales = await findMany(SALE, saleFields, filters);

    return sales;
  },

  async getStats() {
    return await strapi.service(SALE).getStats();
  },

  async findOne(ctx) {
    const { uuid } = ctx.params;

    const sale = await findOneByUuid(uuid, SALE, saleFields);

    return sale;
  },

  async create(ctx) {
    const { company } = ctx.state;
    const data = ctx.request.body;

    await validateCreate(data);

    await strapi.service(SALE).validateParallelData(data);

    const fol = await strapi.service(SALE).generateNextFol(company);

    const preference = await strapi
      .service(PREFERENCE)
      .findOrCreate(company, "crm", "sales");

    const newSale = await strapi.entityService.create(SALE, {
      data: {
        fol,
        company: company.id,
        isCancelled: false,
        isAuthorized: preference.config.needsAuthorization ? false : true,
        ...data,
      },
      ...saleFields,
    });

    if (!preference.config.needsAuthorization) {
      await strapi.service(SALE).handleCreditSale(data, newSale);

      if (company.applications.includes("inventories")) {
        const releases = await strapi
          .service(STOCK_RELEASE)
          .createStockReleases(newSale);

        const promises = [];

        for (let i = 0; i < releases.length; i++) {
          const release = releases[i];

          const releaseController = strapi.controller(
            "api::stock-release.stock-release"
          );

          const params = {
            params: {
              uuid: release.uuid,
            },
            request: {
              body: {
                quantity: release.quantity,
              },
            },
          };

          promises.push(releaseController.releaseStock(params));

          await Promise.all(promises);
        }
      }
    }

    await strapi.service(SALE).updateCustomerMeta(data);

    return newSale;
  },

  async update(ctx) {
    const { uuid } = ctx.params;
    const data = ctx.request.body;

    await validateCreate(data);

    const sale = await findOneByUuid(uuid, SALE, saleFields);

    await strapi.service(SALE).validateParallelData(data);

    const updatedSale = await strapi.entityService.update(SALE, sale.id, {
      data: {
        ...data,
      },
    });

    await strapi.service(SALE).handleCreditSale(data, updatedSale);
    await strapi.service(SALE).updateCustomerMeta(data);

    return updatedSale;
  },

  async generatePdf(ctx) {
    const { uuid } = ctx.params;
    const { company } = ctx.state;

    const sale = await findOneByUuid(uuid, SALE, saleFields);

    try {
      const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          "--disable-gpu",
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--no-zygote",
        ],
        ignoreDefaultArgs: ["--disable-extensions"],
      });

      const page = await browser.newPage();

      const companyInfo = await strapi.entityService.findOne(
        COMPANY,
        company.id,
        {
          fields: ["name", "website"],
          populate: {
            logotype: {
              fields: ["url", "name"],
            },
            fiscalInfo: {
              fields: ["legalName", "rfc", "regime"],
              populate: {
                address: true,
              },
            },
            address: true,
          },
        }
      );

      const { config } = await strapi.query(PREFERENCE).findOne({
        where: {
          company: company.id,
          app: "crm",
          module: "estimates",
        },
      });

      const template = defaultSale(sale, config, companyInfo);

      await page.setContent(template);

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: 30,
          right: 40,
          bottom: 30,
          left: 40,
        },
      });

      await browser.close();

      ctx.response.type = "application/pdf";
      ctx.response.attachment("tester.pdf");
      ctx.response.length = "pdfBuffer.length";

      ctx.body = pdfBuffer;
    } catch (error) {
      console.error(error);

      throw new BadRequestError("Error while generating pdf", {
        key: "sale.pdfGeneration",
        path: ctx.request.url,
      });
    }
  },

  async authorize(ctx) {
    const { company } = ctx.state;
    const { uuid } = ctx.params;

    const sale = await findOneByUuid(uuid, SALE, {
      fields: ["date", "paymentScheme"],
      populate: {
        customer: {
          populate: {
            credit: true,
          },
        },
      },
    });

    const updatedSale = await strapi.entityService.update(SALE, sale.id, {
      data: {
        isAuthorized: true,
        authorizedAt: new Date(),
      },
      ...saleFields,
    });

    await strapi.service(SALE).handleCreditSale(
      {
        customer: sale.customer.id,
        customerCredit: sale.customer.credit,
        paymentScheme: sale.paymentScheme,
      },
      sale
    );
    await strapi
      .service(SALE)
      .updateCustomerMeta({ customer: sale.customer.id, date: sale.date });

    if (company.applications.includes("inventories")) {
      await strapi.service(STOCK_RELEASE).createStockReleases(updatedSale);
    }

    return updatedSale;
  },

  async cancell(ctx) {
    const { uuid } = ctx.params;

    const sale = await findOneByUuid(uuid, SALE, {
      fields: ["date", "paymentScheme"],
      populate: {
        customer: {
          populate: {
            credit: true,
          },
        },
      },
    });

    const updatedSale = await strapi.entityService.update(SALE, sale.id, {
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
      },
      ...saleFields,
    });

    await strapi.service(SALE).handleCreditSale(
      {
        customer: sale.customer.id,
        customerCredit: sale.customer.credit,
        paymentScheme: sale.paymentScheme,
      },
      sale
    );

    return updatedSale;
  },

  async delete(ctx) {
    const { uuid } = ctx.params;

    const { id, customer } = await findOneByUuid(uuid, SALE, {
      populate: {
        customer: {
          populate: {
            credit: true,
          },
        },
      },
    });

    await strapi.service(SALE).updateEstimateMetaInfo(id);

    await strapi.service(SALE).deleteParallelData(id);

    const deletedSale = await strapi.entityService.delete(SALE, id);

    await strapi
      .service(SALE)
      .updateLineCreditUsage(customer.id, customer.credit);

    await strapi
      .service(SALE)
      .updateCustomerMeta({ customer: customer.id, date: null });

    return deletedSale;
  },
}));
