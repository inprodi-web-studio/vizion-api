const { STOCK_RESERVATION } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(STOCK_RESERVATION, ({ strapi }) => ({
    async registerReservations(items, releaseId) {
        const ctx = strapi.requestContext.get();
        const stockItems = items.filter( i => i.product?.stockInfo?.id );

        try {
            await strapi.db.connection.raw('START TRANSACTION;');

            for (let i = 0; i < stockItems.length; i++) {
                const item = stockItems[i];
                await strapi.service( STOCK_RESERVATION ).distributeReservation(item, releaseId);
            }

            await strapi.db.connection.raw('COMMIT;');
        } catch (e) {
            // Revierte la transacción si hay algún error
            await strapi.db.connection.raw('ROLLBACK;');

            console.log(e);

            if (e.key === "stock-reservation.notEnoughStock") {
              throw e;
            }

            throw new BadRequestError("Error while adjusting stock", {
                key: "stock-movement.sqlError",
                path: ctx.request.url,
            });
        }
    },

    async distributeReservation(item, releaseId) {
        const ctx = strapi.requestContext.get();

        try {
          const totalToReserve = item.package 
          ? item.quantity * item.realQuantity
          : item.toReserve;

          const [stocks] = await strapi.db.connection.raw(`
            SELECT
                spl.stock_id,
                s.uuid,
                s.quantity,
                s.package_quantity,
                p.uuid AS package,
                l.uuid AS location,
                pb.uuid AS badge,
                shpos.uuid AS position,
                s.position_partition AS positionPartition,
                pb.expiration_date,
                COALESCE(reserved.total_reserved, 0) AS reservedQuantity
            FROM stocks_product_links AS spl
            JOIN stocks AS s ON s.id = spl.stock_id
            JOIN stocks_location_links AS sll ON sll.stock_id = s.id
            JOIN stock_locations AS l ON sll.stock_location_id = l.id
            LEFT JOIN stocks_package_links AS spacl ON s.id = spacl.stock_id
            LEFT JOIN packages AS p ON spacl.package_id = p.id
            LEFT JOIN stocks_badge_links AS sbl ON s.id = sbl.stock_id
            LEFT JOIN product_badges AS pb ON sbl.product_badge_id = pb.id
            LEFT JOIN stocks_position_links AS sposl ON s.id = sposl.stock_id
            LEFT JOIN shelf_positions AS shpos ON sposl.shelf_position_id = shpos.id
            LEFT JOIN stocks_variation_links AS svl ON s.id = svl.stock_id
            LEFT JOIN product_variations AS pv ON svl.product_variation_id = pv.id
            LEFT JOIN (
                SELECT srs.stock_id, SUM(sr.quantity) AS total_reserved
                FROM stock_reservations_stock_links AS srs
                JOIN stock_reservations AS sr ON sr.id = srs.stock_reservation_id
                GROUP BY srs.stock_id
            ) reserved ON reserved.stock_id = s.id
            WHERE spl.product_id = ?
              AND ( ? IS NULL OR pv.id = ? )
            ORDER BY
                CASE WHEN ? IS NOT NULL AND p.uuid = ? THEN 0 ELSE 1 END,
                l.reservation_order ASC,
                CASE WHEN pb.expiration_date IS NULL THEN 1 ELSE 0 END,
                pb.expiration_date ASC
              FOR UPDATE;
          `, [
            item.product.id,
            (item.variation ? item.variation.id : null),
            (item.variation ? item.variation.id : null),
            (item.package ? item.package.uuid : null),
            (item.package ? item.package.uuid : null)
          ]);
      
          let remainingQuantity = totalToReserve;
          const reservationsToCreate = [];
          
          for (const stock of stocks) {
            const reserved = stock.reservedQuantity ? stock.reservedQuantity : 0;
            const available = stock.quantity - reserved;
            
            if (available <= 0) continue;
            
            const allocate = Math.min(available, remainingQuantity);

            reservationsToCreate.push({
              stock_id: stock.stock_id,
              allocated: allocate
            });
            
            remainingQuantity -= allocate;
            if (remainingQuantity <= 0) break;
          }

          if (remainingQuantity > 0) {
            const reservedSoFar = totalToReserve - remainingQuantity;

            throw new BadRequestError("There is not enough stock", {
              path : ctx.request.url,
              key : "stock-reservation.notEnoughStock",
              params : {
                reserved: reservedSoFar,
                pending: remainingQuantity
              }
            });
          }
      
          for (const reservation of reservationsToCreate) {
            const [reservationResult] = await strapi.db.connection.raw(`
              INSERT INTO stock_reservations (uuid, quantity, created_at, updated_at)
              VALUES (UUID(), ?, NOW(), NOW());
            `, [reservation.allocated]);
            
            const reservationId = reservationResult.insertId;
            
            await strapi.db.connection.raw(`
              INSERT INTO stock_reservations_stock_links (stock_reservation_id, stock_id)
              VALUES (?, ?);
            `, [reservationId, reservation.stock_id]);

            await strapi.db.connection.raw(`
              INSERT INTO stock_releases_reservations_links (stock_release_id, stock_reservation_id)
              VALUES (?, ?);
            `, [releaseId, reservationId]);
          }
      
        } catch (e) {
          throw e;
        }
    }
}));
