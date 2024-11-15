const { STOCK_MOVEMENT, PRODUCT, STOCK_LOCATION, ADJUSTMENT_MOTIVE } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(STOCK_MOVEMENT, ({ strapi }) => ({
    async validateAdjustmentParallelData(data) {
        for ( let i = 0; i < data.length; i++ ) {
            const { id : productId } = await findOneByUuid( data[i].product, PRODUCT );

            data[i].product = productId;

            const { id : stockLocationId } = await findOneByUuid( data[i].location, STOCK_LOCATION, {}, false );

            data[i].location = stockLocationId;

            const { id : motiveId } = await findOneByUuid( data[i].motive, ADJUSTMENT_MOTIVE );

            data[i].motive = motiveId;
        }
    },

    async handleAdjustment(data) {
        const ctx = strapi.requestContext.get();
        try {
            await strapi.db.connection.raw('START TRANSACTION;');
    
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const { product, location, quantity, motive, comments } = item;
    
                try {
                    const [result] = await strapi.db.connection.raw(`
                        SELECT spl.stock_id, s.quantity
                        FROM stocks_product_links AS spl
                        JOIN stocks_location_links AS sll ON spl.stock_id = sll.stock_id
                        JOIN stocks AS s ON s.id = spl.stock_id
                        WHERE spl.product_id = ?
                        AND sll.stock_location_id = ?
                        FOR UPDATE;
                    `, [product, location]);
    
                    let stockId, currentQuantity;
    
                    if (result.length) {
                        stockId = result[0].stock_id;
                        currentQuantity = result[0].quantity;
                    } else {
                        if (quantity < 0) {
                            throw new BadRequestError(`Item with index ${i} has a negative quantity for a new stock`, {
                                path: ctx.request.url,
                                key: `[${i}]-stock-movement.negativeQuantityNew`,
                            });
                        }
    
                        // Inserta el nuevo stock y relaciones
                        const [insertStockResult] = await strapi.db.connection.raw(`
                            INSERT INTO stocks (uuid, quantity)
                            VALUES (UUID(), 0);
                        `);
    
                        stockId = insertStockResult.insertId;
                        currentQuantity = 0;
    
                        await strapi.db.connection.raw(`
                            INSERT INTO stocks_product_links (stock_id, product_id)
                            VALUES (?, ?);
                        `, [stockId, product]);
    
                        await strapi.db.connection.raw(`
                            INSERT INTO stocks_location_links (stock_id, stock_location_id)
                            VALUES (?, ?);
                        `, [stockId, location]);
                    }
    
                    const newQuantity = currentQuantity + quantity;
    
                    if (newQuantity < 0) {
                        throw new BadRequestError(`Item with index ${i} has a negative quantity for an existing stock`, {
                            path: ctx.request.url,
                            key: `[${i}]-stock-movement.negativeQuantityExisting`,
                        });
                    }
    
                    // Actualiza la cantidad de stock
                    await strapi.db.connection.raw(`
                        UPDATE stocks
                        SET quantity = ?
                        WHERE id = ?;
                    `, [newQuantity, stockId]);

                    // Registramos el movimiento de inventario
                    const [insertStockMovementResult] = await strapi.db.connection.raw(`
                        INSERT INTO stock_movements ( uuid, quantity, type, comments )    
                        VALUES( UUID(), ?, ?, ?)
                    `, [quantity, "adjustment", comments]);

                    const stockMovementId = insertStockMovementResult.insertId;

                    await strapi.db.connection.raw(`
                        INSERT INTO stock_movements_product_links (stock_movement_id, product_id)
                        VALUES(?, ?)    
                    `, [stockMovementId, product]);

                    await strapi.db.connection.raw(`
                        INSERT INTO stock_movements_motive_links (stock_movement_id, adjustment_motive_id)
                        VALUES(?, ?)
                    `, [stockMovementId, motive]);

                    await strapi.db.connection.raw(`
                        INSERT INTO stock_movements_location_links (stock_movement_id, stock_location_id)
                        VALUES(?, ?)
                    `, [stockMovementId, location]);
    
                } catch (e) {
                    throw e;
                }
            }
    
            await strapi.db.connection.raw('COMMIT;');
    
        } catch (e) {
            // Revierte la transacción si hay algún error
            await strapi.db.connection.raw('ROLLBACK;');
    
            console.log(e);
    
            if (e.key && (e.key.includes("stock-movement.negativeQuantityExisting") || e.key.includes("stock-movement.negativeQuantityNew"))) {
                throw e;
            }
    
            throw new BadRequestError("Error while adjusting stock", {
                key: "stock-movement.sqlError",
                path: ctx.request.url,
            });
        }
    }    
}));
