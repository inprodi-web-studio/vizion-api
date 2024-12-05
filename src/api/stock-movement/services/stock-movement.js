const {
    STOCK_MOVEMENT,
    PRODUCT,
    STOCK_LOCATION,
    ADJUSTMENT_MOTIVE,
    PRODUCT_BADGE,
    PRODUCT_VARIATION,
    PACKAGE,
    SHELF,
    SHELF_POSITION,
} = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(STOCK_MOVEMENT, ({ strapi }) => ({
    async validateAdjustmentParallelData(data) {
        const ctx = strapi.requestContext.get();
        const createdBadges = [];

        try {
            for ( let i = 0; i < data.length; i++ ) {
                const { id : productId, stockInfo, type, unity } = await findOneByUuid( data[i].product, PRODUCT, {
                    populate : {
                        stockInfo : true,
                        unity : {
                            fields : ["id"],
                        },
                    },
                });
    
                data[i].product = productId;
                data[i].unity = unity.id;

                if ( type === "variable" && !data[i].variation ) {
                    throw new BadRequestError( `Item with index ${ i } is a variable product but no variation was specified`, {
                        path : ctx.request.url,
                        key : `[${i}]-stock-movement.requiredVariation`,
                    });
                }

                if ( type === "variable" ) {
                    const { id } = await findOneByUuid( data[i].variation, PRODUCT_VARIATION );

                    data[i].variation = id;
                }
    
                const { newBadge } = await strapi.service( STOCK_MOVEMENT ).validateBadge( data[i], stockInfo, i );
    
                if ( newBadge ) {
                    createdBadges.push( newBadge );
                }

                if (data[i].location) {
                    const { id : stockLocationId } = await findOneByUuid( data[i].location, STOCK_LOCATION, {}, false );
    
                    data[i].location = stockLocationId;
                }

                if (data[i].origin?.location) {
                    const { id : stockLocationId } = await findOneByUuid( data[i].origin.location, STOCK_LOCATION, {}, false );
    
                    data[i].origin.location = stockLocationId;
                }

                if (data[i].destination?.location) {
                    const { id : stockLocationId } = await findOneByUuid( data[i].destination.location, STOCK_LOCATION, {}, false );
    
                    data[i].destination.location = stockLocationId;
                }

                if ( data[i].shelf ) {
                    const { id : shelfId } = await findOneByUuid( data[i].shelf, SHELF );

                    data[i].shelf = shelfId;
                }

                if (data[i].origin?.shelf) {
                    const { id : shelfId } = await findOneByUuid( data[i].origin.shelf, SHELF );

                    data[i].origin.shelf = shelfId;
                }

                if (data[i].destination?.shelf) {
                    const { id : shelfId } = await findOneByUuid( data[i].destination.shelf, SHELF );

                    data[i].destination.shelf = shelfId;
                }

                if ( data[i].motive ) {
                    const { id : motiveId } = await findOneByUuid( data[i].motive, ADJUSTMENT_MOTIVE );
    
                    data[i].motive = motiveId;
                }

                if ( data[i].package ) {
                    const { id : packageId, realConversion } = await findOneByUuid( data[i].package, PACKAGE );

                    data[i].package = packageId;
                    data[i].packageRealConversion = realConversion;
                }
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

        if ( typeof data.badge === "string" ) {
            const { id : badgeId } = await findOneByUuid( data.badge, PRODUCT_BADGE, {}, false );

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
                    ...( data.variation && { variation : data.variation } ),
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
                    variation : data.variation,
                },
            });

            data.badge = newBadge.id;

            return { newBadge : newBadge.id };
        }

        return {};
    },

    async handleAdjustment(data, createdBadges) {
        const ctx = strapi.requestContext.get();

        try {
            await strapi.db.connection.raw('START TRANSACTION;');
    
            for (let i = 0; i < data.length; i++) {
                await strapi.service(STOCK_MOVEMENT).createOrUpdateStock( data[i] );
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
    },

    async handleRelocation(data) {
        const ctx = strapi.requestContext.get();

        try {
            await strapi.db.connection.raw('START TRANSACTION;');

            for ( let i = 0; i < data.length; i++ ) {
                // Adjust stock from origin
                await strapi.service(STOCK_MOVEMENT).createOrUpdateStock({
                    ...data[i],
                    location : data[i].origin?.location,
                    shelf : data[i].origin?.shelf,
                    xPosition : data[i].origin?.xPosition,
                    yPosition : data[i].origin?.yPosition,
                    partition : data[i].origin?.partition,
                    quantity  : -data[i].quantity,
                }, false, "relocation" );

                // Adjust stock to destination
                await strapi.service(STOCK_MOVEMENT).createOrUpdateStock({
                    ...data[i],
                    location : data[i].destination?.location,
                    shelf : data[i].destination?.shelf,
                    xPosition : data[i].destination?.xPosition,
                    yPosition : data[i].destination?.yPosition,
                    partition : data[i].destination?.partition,
                    quantity  : data[i].quantity,
                }, true, "relocation" );
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
    },

    async getStock(data) {
        const {
            product,
            location,
            badge,
            variation,
            unity,
            package,
            shelf,
            xPosition,
            yPosition,
            partition
        } = data;

        const [ result ] = await strapi.db.connection.raw(`
            SELECT
                spl.stock_id,
                s.quantity,
                s.package_quantity
            FROM
                stocks_product_links AS spl
                JOIN stocks_location_links AS sll ON spl.stock_id = sll.stock_id
                JOIN stocks AS s ON s.id = spl.stock_id
                JOIN stocks_unity_links AS sul ON s.id = sul.stock_id
                JOIN unities AS u ON sul.unity_id = u.id
                LEFT JOIN stocks_package_links AS spacl ON s.id = spacl.stock_id
                LEFT JOIN packages AS p ON spacl.package_id = p.id
                LEFT JOIN stocks_badge_links AS sbl ON s.id = sbl.stock_id
                LEFT JOIN product_badges AS pb ON sbl.product_badge_id = pb.id
                LEFT JOIN stocks_variation_links AS svl ON s.id = svl.stock_id
                LEFT JOIN product_variations AS pv ON svl.product_variation_id = pv.id
                LEFT JOIN stocks_position_links AS sposl ON s.id = sposl.stock_id
                LEFT JOIN shelf_positions AS shpos ON sposl.shelf_position_id = shpos.id
                LEFT JOIN shelf_positions_shelf_links AS shpos_shelf ON shpos.id = shpos_shelf.shelf_position_id
                LEFT JOIN shelves AS sh ON shpos_shelf.shelf_id = sh.id
            WHERE
                spl.product_id = ?
                AND sll.stock_location_id = ?
                AND u.id = ?
                AND ( ? IS NULL OR pb.id = ? )
                AND ( ? IS NULL OR pv.id = ? )
                AND ( ? IS NULL OR p.id = ? )
                AND ( ? IS NULL OR sh.id = ? )
                AND ( ? IS NULL OR shpos.x_position = ? )
                AND ( ? IS NULL OR shpos.y_position = ? )
                AND ( ? IS NULL OR s.position_partition = ? )
            FOR UPDATE;
        `, [
            product,
            location,
            unity,
            badge ?? null,
            badge ?? null, 
            variation ?? null, 
            variation ?? null,
            package ?? null,
            package ?? null,
            shelf ?? null,
            shelf ?? null,
            xPosition ?? null,
            xPosition ?? null,
            yPosition ?? null,
            yPosition ?? null,
            partition ?? null,
            partition ?? null
        ]);

        return result ?? [];
    },

    async createOrUpdateStock(data, letCreate = true, type = "adjustment") {
        const ctx = strapi.requestContext.get();

        const {
            location,
            product,
            unity,
            badge,
            variation,
            partition,
            package,
            packageRealConversion,
            shelf,
            quantity,
            xPosition,
            yPosition,
        } = data;

        try {
            const result = await strapi.service( STOCK_MOVEMENT ).getStock(data);

            let stockId, currentQuantity, currentPackageQuantity;

            if (result.length > 0) {
                stockId = result[0].stock_id;
                currentQuantity = result[0].quantity;
                currentPackageQuantity = result[0].package_quantity;
            } else if ( letCreate ) {
                if (quantity < 0) {
                    throw new BadRequestError(`An item has a negative quantity for a new stock`, {
                        path: ctx.request.url,
                        key: `stock-movement.negativeQuantityNew`,
                    });
                }

                // Inserta el nuevo stock y relaciones
                const [insertStockResult] = await strapi.db.connection.raw(`
                    INSERT INTO stocks (uuid, quantity, package_quantity)
                    VALUES (UUID(), 0, 0);
                `);

                stockId                = insertStockResult.insertId;
                currentQuantity        = 0;
                currentPackageQuantity = 0;

                await strapi.db.connection.raw(`
                    INSERT INTO stocks_product_links (stock_id, product_id)
                    VALUES (?, ?);
                `, [stockId, product]);

                await strapi.db.connection.raw(`
                    INSERT INTO stocks_location_links (stock_id, stock_location_id)
                    VALUES (?, ?);
                `, [stockId, location]);

                await strapi.db.connection.raw(`
                    INSERT INTO stocks_unity_links (stock_id, unity_id)
                    VALUES (?, ?);
                `, [stockId, unity]);

                if (badge) {
                    await strapi.db.connection.raw(`
                        INSERT INTO stocks_badge_links (stock_id, product_badge_id)
                        VALUES (?, ?);
                    `, [stockId, badge]);
                }

                if (variation) {
                    await strapi.db.connection.raw(`
                        INSERT INTO stocks_variation_links (stock_id, product_variation_id)
                        VALUES (?, ?);
                    `, [stockId, variation]);
                }

                if (package) {
                    await strapi.db.connection.raw(`
                        INSERT INTO stocks_package_links (stock_id, package_id)
                        VALUES (?, ?);
                    `, [stockId, package]);
                }

                if (shelf) {
                    const { id : positionId } = await strapi.query(SHELF_POSITION).findOne({
                        where : {
                            xPosition,
                            yPosition,
                            shelf,
                        },
                    });

                    await strapi.db.connection.raw(`
                        INSERT INTO stocks_position_links (stock_id, shelf_position_id)
                        VALUES (?, ?);
                    `, [stockId, positionId]);
                }
            } else {
                throw new BadRequestError(`Item does not exist in stock`, {
                    path: ctx.request.url,
                    key: `stock-movement.notInStock`,
                });
            }

            let packageQuantity = 0;
            let newQuantity = 0;

            if ( package ) {
                packageQuantity = currentPackageQuantity + quantity;
                newQuantity = currentQuantity + (quantity * packageRealConversion);

                data.packageQuantity = quantity;
                data.quantity = quantity * packageRealConversion;
            } else {
                newQuantity = currentQuantity + quantity;
            }

            if (newQuantity < 0) {
                throw new BadRequestError(`An item has a negative quantity for an existing stock`, {
                    path: ctx.request.url,
                    key: `stock-movement.negativeQuantityExisting`,
                });
            }

            // Actualiza la cantidad de stock
            await strapi.db.connection.raw(`
                UPDATE stocks
                SET quantity = ?, package_quantity = ?, position_partition = ?
                WHERE id = ?;
            `, [newQuantity, packageQuantity, partition ?? null, stockId]);

            await strapi.service( STOCK_MOVEMENT ).registerStockMovement(data, type);
        } catch (e) {
            throw e;
        }
    },
    async registerStockMovement(data, type) {
        const {
            quantity,
            location,
            comments,
            packageQuantity,
            partition,
            product,
            motive,
            unity,
            badge,
            variation,
            package,
            shelf,
            xPosition,
            yPosition,
        } = data;

        const [ insertStockMovementResult ] = await strapi.db.connection.raw(`
            INSERT INTO stock_movements ( uuid, quantity, type, comments, package_quantity, position_partition, created_at )
            VALUES( UUID(), ?, ?, ?, ?, ?, NOW() )
        `, [quantity, type, comments ?? "", packageQuantity ?? null, partition ?? null]);

        const stockMovementId = insertStockMovementResult.insertId;

        await strapi.db.connection.raw(`
            INSERT INTO stock_movements_product_links (stock_movement_id, product_id)
            VALUES(?, ?)    
        `, [stockMovementId, product]);

        if (motive) {
            await strapi.db.connection.raw(`
                INSERT INTO stock_movements_motive_links (stock_movement_id, adjustment_motive_id)
                VALUES(?, ?)
            `, [stockMovementId, motive]);
        }

        await strapi.db.connection.raw(`
            INSERT INTO stock_movements_location_links (stock_movement_id, stock_location_id)
            VALUES(?, ?)
        `, [stockMovementId, location]);

        await strapi.db.connection.raw(`
            INSERT INTO stock_movements_unity_links (stock_movement_id, unity_id)
            VALUES(?, ?)
        `, [stockMovementId, unity]);

        if (badge) {
            await strapi.db.connection.raw(`
                INSERT INTO stock_movements_badge_links (stock_movement_id, product_badge_id)
                VALUES(?, ?)
            `, [stockMovementId, badge]);
        }

        if (variation) {
            await strapi.db.connection.raw(`
                INSERT INTO stock_movements_variation_links (stock_movement_id, product_variation_id)
                VALUES(?, ?)
            `, [stockMovementId, variation]);
        }

        if (package) {
            await strapi.db.connection.raw(`
                INSERT INTO stock_movements_package_links (stock_movement_id, package_id)
                VALUES(?, ?)
            `, [stockMovementId, package]);
        }

        if (shelf) {
            const { id : positionId } = await strapi.query(SHELF_POSITION).findOne({
                where : {
                    xPosition,
                    yPosition,
                    shelf,
                },
            });

            await strapi.db.connection.raw(`
                INSERT INTO stock_movements_position_links (stock_movement_id, shelf_position_id)
                VALUES(?, ?)
            `, [stockMovementId, positionId]);
        }
    },
}));