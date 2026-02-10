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

module.exports = createCoreController(STOCK_RESERVATION, ({ strapi }) => ({
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
}));
