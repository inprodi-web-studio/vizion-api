const {
  STOCK_RESERVATION,
  STOCK_RELEASE,
  STOCK_LOCATION,
  STOCK_MOVEMENT,
} = require("../../../constants/models");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const {
  validateMoveToDispatchLocation,
} = require("../content-types/stock-reservation/stock-reservation.validation");

const { createCoreController } = require("@strapi/strapi").factories;

const pickedFields = {
  fields: ["uuid", "quantity", "realQuantity", "releaseDate", "isCompleted"],
  populate: {
    sale: {
      fields: ["uuid", "fol", "subject"],
      populate: {
        warehouse: {
          fields: ["uuid", "name"],
        },
      },
    },
    product: {
      fields: ["uuid", "name", "sku", "type"],
      populate: {
        images: {
          fields: ["url"],
        },
      },
    },
    unity: {
      fields: ["uuid", "name", "abbreviation"],
    },
    package: {
      fields: ["uuid", "conversionRate", "realConversion"],
      populate: {
        unity: {
          fields: ["uuid", "name", "abbreviation"],
        },
      },
    },
    variation: {
      fields: ["uuid", "name", "sku"],
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
    reservations: {
      fields: ["uuid", "quantity", "isPicked"],
      populate: {
        stock: {
          fields: ["uuid", "quantity", "packageQuantity", "positionPartition"],
          populate: {
            location: {
              fields: ["uuid", "name", "identifier"],
            },
            badge: {
              fields: ["uuid", "name", "expirationDate"],
            },
            unity: {
              fields: ["uuid", "name", "abbreviation"],
            },
            package: {
              fields: ["uuid", "conversionRate", "realConversion"],
              populate: {
                unity: {
                  fields: ["uuid", "name", "abbreviation"],
                },
              },
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
};

module.exports = createCoreController(STOCK_RESERVATION, ({ strapi }) => ({
  async findPicked(ctx) {
    const company = ctx.state.company;

    const releases = await strapi.query(STOCK_RELEASE).findMany({
      where: {
        sale: {
          company: company.id,
        },
        reservations: {
          isPicked: true,
        },
      },
      ...pickedFields,
    });

    const pickings = releases.flatMap((release) => {
      const pickedReservations = release.reservations?.filter(
        (reservation) => reservation.isPicked
      );

      if (!pickedReservations?.length) return [];

      return pickedReservations.map((reservation) => ({
        uuid: reservation.uuid,
        quantity: reservation.quantity,
        isPicked: reservation.isPicked,
        stock: reservation.stock,
        release: {
          uuid: release.uuid,
          quantity: release.quantity,
          realQuantity: release.realQuantity,
          releaseDate: release.releaseDate,
          isCompleted: release.isCompleted,
          product: release.product,
          unity: release.unity,
          package: release.package,
          variation: release.variation,
        },
        sale: release.sale,
      }));
    });

    return pickings;
  },

  async picking(ctx) {
    const company = ctx.state.company;
    const data = ctx.request.body;

    await validateMoveToDispatchLocation(data);

    const releaseCount = await strapi.query(STOCK_RELEASE).count({
      where: {
        reservations: {
          uuid: data.reservation,
        },
        sale: {
          company: company.id,
        },
      },
    });

    if (!releaseCount) {
      throw new NotFoundError(
        `stock-reservation with uuid ${data.reservation} not found`,
        {
          key: "stock-reservation.notFound",
          path: ctx.request.path,
        }
      );
    }

    const reservation = await findOneByUuid(
      data.reservation,
      STOCK_RESERVATION,
      {
        populate: {
          stock: {
            populate: {
              product: true,
              location: {
                populate: {
                  warehouse: true,
                },
              },
              unity: true,
              badge: true,
              variation: true,
              package: true,
              position: {
                populate: {
                  shelf: true,
                },
              },
            },
          },
        },
      },
      false
    );

    if (!reservation.stock) {
      throw new BadRequestError("Reservation has no stock assigned", {
        key: "stock-reservation.missingStock",
        path: ctx.request.path,
      });
    }

    const destination = await findOneByUuid(
      data.location,
      STOCK_LOCATION,
      {
        populate: {
          warehouse: {
            populate: {
              company: true,
            },
          },
        },
      },
      false
    );

    if (destination?.warehouse?.company?.id !== company.id) {
      throw new NotFoundError(
        `stock-location with uuid ${data.location} not found`,
        {
          key: "stock-location.notFound",
          path: ctx.request.path,
        }
      );
    }

    if (!destination.allowDispatches) {
      throw new BadRequestError(
        "Destination location does not allow dispatches",
        {
          key: "stock-location.dispatchNotAllowed",
          path: ctx.request.path,
        }
      );
    }

    if (destination.id === reservation.stock.location?.id) {
      throw new BadRequestError(
        "Origin and destination cannot be the same location",
        {
          key: "stock-reservation.sameLocation",
          path: ctx.request.path,
        }
      );
    }

    if (reservation.isPicked) {
      throw new BadRequestError("Reservation has already been picked", {
        key: "stock-reservation.alreadyPicked",
        path: ctx.request.path,
      });
    }

    const quantityToMove = Number(reservation.quantity);
    const packageRealConversion = reservation.stock.package?.realConversion
      ? Number(reservation.stock.package.realConversion)
      : null;
    const movementQuantity = packageRealConversion
      ? quantityToMove / packageRealConversion
      : quantityToMove;

    try {
      await strapi.db.connection.raw("START TRANSACTION;");

      await strapi.service(STOCK_MOVEMENT).createOrUpdateStock(
        {
          product: reservation.stock.product.id,
          location: reservation.stock.location.id,
          unity: reservation.stock.unity.id,
          badge: reservation.stock.badge?.id ?? null,
          variation: reservation.stock.variation?.id ?? null,
          package: reservation.stock.package?.id ?? null,
          packageRealConversion: packageRealConversion ?? null,
          shelf: reservation.stock.position?.shelf?.id ?? null,
          xPosition: reservation.stock.position?.xPosition ?? null,
          yPosition: reservation.stock.position?.yPosition ?? null,
          partition: reservation.stock.positionPartition ?? null,
          quantity: -movementQuantity,
        },
        false,
        "dispatch"
      );

      await strapi.service(STOCK_MOVEMENT).createOrUpdateStock(
        {
          product: reservation.stock.product.id,
          location: destination.id,
          unity: reservation.stock.unity.id,
          badge: reservation.stock.badge?.id ?? null,
          variation: reservation.stock.variation?.id ?? null,
          package: reservation.stock.package?.id ?? null,
          packageRealConversion: packageRealConversion ?? null,
          quantity: movementQuantity,
        },
        true,
        "dispatch"
      );

      const destinationStocks = await strapi.service(STOCK_MOVEMENT).getStock({
        product: reservation.stock.product.id,
        location: destination.id,
        unity: reservation.stock.unity.id,
        badge: reservation.stock.badge?.id ?? null,
        variation: reservation.stock.variation?.id ?? null,
        package: reservation.stock.package?.id ?? null,
      });

      if (!destinationStocks?.length) {
        throw new BadRequestError("Destination stock was not created", {
          key: "stock-reservation.destinationStockNotFound",
          path: ctx.request.path,
        });
      }

      await strapi.db.connection.raw(
        `
          UPDATE stock_reservations
          SET is_picked = ?, updated_at = NOW()
          WHERE id = ?;
        `,
        [true, reservation.id]
      );

      await strapi.db.connection.raw(
        `
          UPDATE stock_reservations_stock_links
          SET stock_id = ?
          WHERE stock_reservation_id = ?;
        `,
        [destinationStocks[0].stock_id, reservation.id]
      );

      await strapi.db.connection.raw("COMMIT;");
    } catch (e) {
      await strapi.db.connection.raw("ROLLBACK;");
      throw e;
    }

    return {
      reservation: reservation.uuid,
      location: destination.uuid,
      movedQuantity: quantityToMove,
      isPicked: true,
    };
  },

  async output(ctx) {
    const { uuid } = ctx.params;
    const company = ctx.state.company;

    const releaseCount = await strapi.query(STOCK_RELEASE).count({
      where: {
        reservations: {
          uuid,
        },
        sale: {
          company: company.id,
        },
      },
    });

    if (!releaseCount) {
      throw new NotFoundError(`stock-reservation with uuid ${uuid} not found`, {
        key: "stock-reservation.notFound",
        path: ctx.request.path,
      });
    }

    const reservation = await findOneByUuid(
      uuid,
      STOCK_RESERVATION,
      {
        populate: {
          stock: {
            populate: {
              product: true,
              location: true,
              unity: true,
              badge: true,
              variation: true,
              package: true,
              position: {
                populate: {
                  shelf: true,
                },
              },
            },
          },
        },
      },
      false
    );

    if (!reservation.isPicked) {
      throw new BadRequestError("Reservation must be picked before output", {
        key: "stock-reservation.notPicked",
        path: ctx.request.path,
      });
    }

    if (!reservation.stock) {
      throw new BadRequestError("Reservation has no stock assigned", {
        key: "stock-reservation.missingStock",
        path: ctx.request.path,
      });
    }

    const quantityToOutput = Number(reservation.quantity);
    const packageRealConversion = reservation.stock.package?.realConversion
      ? Number(reservation.stock.package.realConversion)
      : null;
    const movementQuantity = packageRealConversion
      ? quantityToOutput / packageRealConversion
      : quantityToOutput;

    try {
      await strapi.db.connection.raw("START TRANSACTION;");

      await strapi.db.connection.raw(
        `
          DELETE FROM stock_reservations_stock_links
          WHERE stock_reservation_id = ?;
        `,
        [reservation.id]
      );

      await strapi.service(STOCK_MOVEMENT).createOrUpdateStock(
        {
          product: reservation.stock.product.id,
          location: reservation.stock.location.id,
          unity: reservation.stock.unity.id,
          badge: reservation.stock.badge?.id ?? null,
          variation: reservation.stock.variation?.id ?? null,
          package: reservation.stock.package?.id ?? null,
          packageRealConversion: packageRealConversion ?? null,
          shelf: reservation.stock.position?.shelf?.id ?? null,
          xPosition: reservation.stock.position?.xPosition ?? null,
          yPosition: reservation.stock.position?.yPosition ?? null,
          partition: reservation.stock.positionPartition ?? null,
          quantity: -movementQuantity,
        },
        false,
        "dispatch-output"
      );

      await strapi.db.connection.raw(
        `
          DELETE FROM stock_releases_reservations_links
          WHERE stock_reservation_id = ?;
        `,
        [reservation.id]
      );

      try {
        await strapi.db.connection.raw(
          `
            DELETE FROM stock_dispatches_reservations_links
            WHERE stock_reservation_id = ?;
          `,
          [reservation.id]
        );
      } catch (e) {
        if (e?.code !== "ER_NO_SUCH_TABLE") {
          throw e;
        }
      }

      try {
        await strapi.db.connection.raw(
          `
            DELETE FROM stock_reservations_dispatches_links
            WHERE stock_reservation_id = ?;
          `,
          [reservation.id]
        );
      } catch (e) {
        if (e?.code !== "ER_NO_SUCH_TABLE") {
          throw e;
        }
      }

      await strapi.db.connection.raw(
        `
          DELETE FROM stock_reservations
          WHERE id = ?;
        `,
        [reservation.id]
      );

      await strapi.db.connection.raw("COMMIT;");
    } catch (e) {
      await strapi.db.connection.raw("ROLLBACK;");
      throw e;
    }

    return {
      reservation: uuid,
      outputQuantity: quantityToOutput,
      status: "completed",
    };
  },
}));
