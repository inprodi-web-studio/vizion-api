const { STOCK_MOVEMENT, PRODUCT, STOCK_LOCATION, ADJUSTMENT_MOTIVE, PRODUCT_BADGE } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(STOCK_MOVEMENT, ({ strapi }) => ({
    async validateAdjustmentParallelData(data) {
        const ctx = strapi.requestContext.get();
        const createdBadges = [];

        try {
            for ( let i = 0; i < data.length; i++ ) {
                const { id : productId, stockInfo, type } = await findOneByUuid( data[i].product, PRODUCT, {
                    populate : {
                        stockInfo : true,
                    },
                });
    
                data[i].product = productId;

                if ( type === "variable" && !data[i].variation ) {
                    throw new BadRequestError( `Item with index ${ i } is a variable product but no variation was specified`, {
                        path : ctx.request.url,
                        key : `[${i}]-stock-movement.requiredVariation`,
                    });
                }
    
                const { newBadge } = await strapi.service( STOCK_MOVEMENT ).validateBadge( data[i], stockInfo, i );
    
                if ( newBadge ) {
                    createdBadges.push( newBadge );
                }
    
                const { id : stockLocationId } = await findOneByUuid( data[i].location, STOCK_LOCATION, {}, false );
    
                data[i].location = stockLocationId;
    
                const { id : motiveId } = await findOneByUuid( data[i].motive, ADJUSTMENT_MOTIVE );
    
                data[i].motive = motiveId;
            }
    
            return {
                createdBadges
            };
        } catch (error) {
            for ( let i = 0; i < createdBadges.length; i++ ) {
                await strapi.entityService.delete( PRODUCT_BADGE, createdBadges[i] );
            }

            throw error;
        }
    },

    async validateBadge( data, { hasBatches, isPerishable }, i ) {
        const ctx = strapi.requestContext.get();

        if ( hasBatches && !data.badge ) {
            throw new BadRequestError( `Item with index ${ i } is configured to have bathces but was not specified`, {
                path : ctx.request.url,
                key : `[${i}]-stock-movement.requiredBatch`,
            });
        }

        if ( data.badge?.uuid ) {
            const { id : badgeId } = await findOneByUuid( data.badge.uuid, PRODUCT_BADGE, {}, false );

            data.badge = badgeId;
        }

        if ( data.badge?.name ) {
            if ( isPerishable && !data.badge.expirationDate ) {
                throw new BadRequestError( `Item with index ${ i } is perishable but no expiration date was specified`, {
                    path : ctx.request.url,
                    key : `[${i}]-stock-movement.requiredExpirationDate`,
                });
            }

            const conflictBadge = await strapi.query( PRODUCT_BADGE ).count({
                where : {
                    name : data.badge.name,
                    product : data.product,
                },
            });

            if ( conflictBadge ) {
                throw new BadRequestError( `Item with index ${ i } already has a badge with this name`, {
                    path : ctx.request.url,
                    key : `[${i}]-stock-movement.duplicatedBadge`,
                });
            }

            const newBadge = await strapi.entityService.create( PRODUCT_BADGE, {
                data : {
                    name : data.badge.name,
                    expirationDate : data.badge.expirationDate,
                    product : data.product,
                },
            });

            data.badge = newBadge.id;

            return { newBadge : newBadge.id };
        }

        return {};
    },

    async handleAdjustment(data, createdBadges) {
        console.log(createdBadges);
        const ctx = strapi.requestContext.get();
        try {
            await strapi.db.connection.raw('START TRANSACTION;');
    
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const { product, location, quantity, motive, badge, comments } = item;
    
                try {
                    const [result] = await strapi.db.connection.raw(`
                        SELECT spl.stock_id, s.quantity
                        FROM stocks_product_links AS spl
                        JOIN stocks_location_links AS sll ON spl.stock_id = sll.stock_id
                        JOIN stocks AS s ON s.id = spl.stock_id
                        LEFT JOIN stocks_badge_links AS sbl ON s.id = sbl.stock_id
                        LEFT JOIN product_badges AS pb ON sbl.product_badge_id = pb.id
                        WHERE spl.product_id = ?
                        AND sll.stock_location_id = ?
                        AND (? IS NULL OR pb.id = ?)
                        FOR UPDATE;
                    `, [product, location, badge ?? null, badge ?? null]);
    
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

                        if (badge) {
                            await strapi.db.connection.raw(`
                                INSERT INTO stocks_badge_links (stock_id, product_badge_id)
                                VALUES (?, ?);
                            `, [stockId, badge]);
                        }
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
                    `, [quantity, "adjustment", comments ?? ""]);

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

                    if (badge) {
                        await strapi.db.connection.raw(`
                            INSERT INTO stock_movements_badge_links (stock_movement_id, product_badge_id)
                            VALUES(?, ?)
                        `, [stockMovementId, badge]);
                    }
    
                } catch (e) {
                    throw e;
                }
            }
    
            await strapi.db.connection.raw('COMMIT;');
    
        } catch (e) {
            // Revierte la transacción si hay algún error
            await strapi.db.connection.raw('ROLLBACK;');

            for ( let i = 0; i < createdBadges.length; i++ ) {
                await strapi.entityService.delete( PRODUCT_BADGE, createdBadges[i] );
            }
    
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