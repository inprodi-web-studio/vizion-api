const dayjs = require("dayjs");
const { DISPATCH, STOCK_DISPATCH } = require("../../../constants/models");
const { BadRequestError } = require("../../../helpers/errors");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");

const { createCoreController } = require("@strapi/strapi").factories;

const dispatchFields = {
  fields: ["uuid", "fol", "startDate", "endDate"],
  populate: {
    stockDispatches: {
      fields: ["uuid", "quantity", "isCompleted"],
      populate: {
        release: {
          fields: ["uuid"],
          populate: {
            sale: {
              fields: ["uuid", "fol"],
              populate: {
                warehouse: {
                  fields: ["uuid", "layout"],
                },
              },
            },
            product: {
              fields: ["uuid", "name", "sku", "type"],
              populate: {
                images: {
                  fields: ["url", "name", "size", "mime"],
                },
              },
            },
            unity: {
              fields: ["uuid", "name", "abbreviation"],
            },
            package: {
              fields: ["uuid", "conversionRate", "realConversion"],
              unity: {
                fields: ["uuid", "name", "abbreviation"],
              },
            },
            variation: {
              fields: ["uuid", "name", "sku"],
              populate: {
                image: {
                  fields: ["url"],
                },
                values: {
                  fields: ["uuid", "name"],
                  populate: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },
        reservations: {
          fields: ["uuid", "quantity", "isPicked"],
          populate: {
            stock: {
              fields: [
                "uuid",
                "quantity",
                "positionPartition",
                "packageQuantity",
              ],
              populate: {
                location: {
                  fields: ["uuid", "name"],
                  populate: {
                    warehouse: {
                      fields: ["uuid", "layout"],
                    },
                  },
                },
                badge: {
                  fields: ["uuid", "name", "expirationDate"],
                },
                position: {
                  fields: ["uuid", "xPosition", "yPosition"],
                  populate: {
                    shelf: {
                      fields: ["uuid", "name"],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = createCoreController(DISPATCH, ({ strapi }) => ({
  async find(ctx) {
    const filters = {
      $search: ["fol"],
    };

    const dispatches = await findMany(DISPATCH, dispatchFields, filters);

    return dispatches;
  },

  async findOne(ctx) {
    const { uuid } = ctx.params;

    const dispatch = await findOneByUuid(uuid, DISPATCH, dispatchFields);

    return dispatch;
  },

  async create(ctx) {
    const company = ctx.state.company;
    const data = ctx.request.body;

    if (!data?.warehouse) {
      throw new BadRequestError("Missing warehouse", {
        key: "dispatch.missingWarehouse",
        path: ctx.request.path,
      });
    }

    const lastDispatch = await strapi.entityService.findMany(DISPATCH, {
      filters: {
        company: company.id,
      },
      sort: ["createdAt:desc"],
      limit: 1,
      ...dispatchFields,
    });

    console.log(lastDispatch[0]);
    console.log(!lastDispatch[0]?.endDate);

    if (lastDispatch[0] && !lastDispatch[0]?.endDate) {
      throw new BadRequestError(
        "Cant create a new dispatch, there is an open one",
        {
          key: "dispatch.openDispatch",
          path: ctx.request.path,
        }
      );
    }

    const stockDispatches = await strapi.query(STOCK_DISPATCH).findMany({
      where: {
        $or: [
          {
            createdAt: {
              $lte: dayjs().toISOString(),
              ...(lastDispatch.length > 0 && {
                $gte: lastDispatch[0].createdAt,
              }),
            },
          },
          {
            isCompleted: false,
          },
        ],
        release: {
          sale: {
            warehouse: {
              uuid: data.warehouse,
            },
          },
        },
      },
    });

    if (stockDispatches.length === 0) {
      return {
        fol: -1,
      };
    }

    const newDispatch = await strapi.entityService.create(
      DISPATCH,
      {
        data: {
          fol: lastDispatch.length > 0 ? lastDispatch[0].fol + 1 : 1,
          company: company.id,
          startDate: dayjs().toISOString(),
          stockDispatches: stockDispatches.map((dispatch) => dispatch.id),
          isCancelled: false,
        },
      },
      dispatchFields
    );

    return newDispatch;
  },

  async conclude(ctx) {
    const { uuid } = ctx.params;

    const dispatch = await findOneByUuid(uuid, DISPATCH);

    const updatedDispatch = await strapi.entityService.update(
      DISPATCH,
      dispatch.id,
      {
        data: {
          endDate: dayjs().toISOString(),
        },
      },
      dispatchFields
    );

    return updatedDispatch;
  },
}));
