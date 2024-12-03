const { STOCK, WAREHOUSE, STOCK_LOCATION, PRODUCT, PRODUCT_VARIATION, PRODUCT_BADGE, PACKAGE } = require('../../../constants/models');
const { pop } = require('../../../constants/regimes');
const { BadRequestError } = require('../../../helpers/errors');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const product = require('../../product/controllers/product');

const { createCoreController } = require('@strapi/strapi').factories;

const stockFields = {
    fields : ["uuid", "quantity", "packageQuantity", "positionPartition"],
    populate : {
        product : {
            fields : ["uuid", "name", "sku", "type"],
        },
        badge : {
            fields : ["uuid", "name", "expirationDate"],
        },
        variation : {
            fields : ["uuid", "name", "sku"],
            populate : {
                values : {
                    fields : ["uuid", "name"],
                    populate : {
                        attribute : {
                            fields : ["uuid", "name"],
                        },
                    },
                }
            },
        },
        unity : {
            fields : ["uuid", "name", "abbreviation"],
        },
        package : {
            fields : ["uuid", "conversionRate", "realConversion"],
            populate : {
                unity : {
                    fields : ["uuid", "name", "abbreviation"],
                }
            },
        },
        position : {
            fields : ["uuid", "xPosition", "yPosition", "rotation", "partitions"],
            populate : {
                shelf : {
                    fields : ["uuid", "name", "xPositions", "yPositions"],
                },
            }
        },
    },
};

module.exports = createCoreController(STOCK, ({ strapi }) => ({
    async find(ctx) {
        const {uuid, locationUuid} = ctx.params;
        const { search, pagination } = ctx.query;

        const { page, pageSize } = pagination ?? {};

        await findOneByUuid( uuid, WAREHOUSE );

        const location = await findOneByUuid( locationUuid, STOCK_LOCATION );

        try {
            const [countResult] = await strapi.db.connection.raw(`
                SELECT COUNT(DISTINCT p.id) as total
                FROM
                    stocks_product_links AS spl
                    JOIN products AS p ON spl.product_id = p.id
                    JOIN stocks_location_links AS sll ON spl.stock_id = sll.stock_id
                    JOIN stock_locations AS sl ON sl.id = sll.stock_location_id
                WHERE
                    sl.id = ?
                    AND ( ? IS NULL OR ? = '' OR p.name LIKE ? )
            `, [location.id, search ?? null, search ?? null, `%${search}%`]);

            const current  = page ?? 1;
            const limit    = pageSize ?? 30;
            const total    = parseInt( countResult[0].total );
            const offset   = (current - 1) * limit;

            const [ result ] = await strapi.db.connection.raw(`
                SELECT
                    JSON_OBJECT(
                        'uuid', p.uuid,
                        'name', p.name,
                        'sku', p.sku,
                        'unity', JSON_OBJECT(
                            'uuid', ANY_VALUE(pru.uuid),
                            'name', ANY_VALUE(pru.name),
                            'abbreviation', ANY_VALUE(pru.abbreviation)
                        )
                    ) AS product,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'uuid', s.uuid,
                            'quantity', s.quantity,
                            'packageQuantity', s.package_quantity,
                            'unity', JSON_OBJECT(
                                'uuid', u.uuid,
                                'name', u.name,
                                'abbreviation', u.abbreviation
                            ),
                            'badge', IF(pb.uuid IS NOT NULL, JSON_OBJECT(
                                'uuid', pb.uuid,
                                'name', pb.name
                            ), NULL),
                            'package', IF(pac.uuid IS NOT NULL, JSON_OBJECT(
                                'uuid', pac.uuid,
                                'conversionRate', pac.conversion_rate,
                                'realConversion', pac.real_conversion,
                                'unity', JSON_OBJECT(
                                    'uuid', upac.uuid,
                                    'name', upac.name,
                                    'abbreviation', upac.abbreviation
                                )
                            ), NULL),
                            'variation', IF(pv.uuid IS NOT NULL, JSON_OBJECT(
                                'uuid', pv.uuid,
                                'name', pv.name,
                                'sku', pv.sku,
                                'values', vv.variation_values
                            ), NULL)
                        )
                    ) AS stocks
                FROM
                    stocks_product_links AS spl
                    JOIN products AS p ON spl.product_id = p.id
                    JOIN stocks_location_links AS sll ON spl.stock_id = sll.stock_id
                    JOIN stock_locations AS sl ON sl.id = sll.stock_location_id
                    JOIN stocks AS s ON s.id = spl.stock_id
                    JOIN stocks_unity_links AS sul ON s.id = sul.stock_id
                    JOIN unities AS u ON sul.unity_id = u.id
                    JOIN products_unity_links AS prul ON p.id = prul.product_id
                    JOIN unities AS pru ON prul.unity_id = pru.id
                    LEFT JOIN stocks_badge_links AS sbl ON s.id = sbl.stock_id
                    LEFT JOIN product_badges AS pb ON sbl.product_badge_id = pb.id
                    LEFT JOIN stocks_package_links AS spacl ON s.id = spacl.stock_id
                    LEFT JOIN packages AS pac ON spacl.package_id = pac.id
                    LEFT JOIN packages_unity_links AS pul ON pac.id = pul.package_id
                    LEFT JOIN unities AS upac ON pul.unity_id = upac.id
                    LEFT JOIN stocks_variation_links AS svl ON s.id = svl.stock_id
                    LEFT JOIN product_variations AS pv ON svl.product_variation_id = pv.id
                    LEFT JOIN (
                        SELECT
                            pv.uuid AS variation_uuid,
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'uuid', av.uuid,
                                    'name', av.name,
                                    'attribute', JSON_OBJECT(
                                        'uuid', pa.uuid,
                                        'name', pa.name
                                    )
                                )
                            ) AS variation_values
                        FROM
                            product_variations AS pv
                            JOIN product_variations_values_links AS pvv ON pv.id = pvv.product_variation_id
                            JOIN attribute_values AS av ON pvv.attribute_value_id = av.id
                            JOIN attribute_values_attribute_links AS aval ON av.id = aval.attribute_value_id
                            JOIN product_attributes AS pa ON aval.product_attribute_id = pa.id
                        GROUP BY
                            pv.uuid
                    ) AS vv ON pv.uuid = vv.variation_uuid
                WHERE
                    sl.id = ?
                    AND ( ? IS NULL OR ? = '' OR p.name LIKE ? )
                GROUP BY
                    p.id
                ORDER BY
                    p.name ASC
                LIMIT ? OFFSET ?;
            `, [location.id, search ?? null, search ?? null, `%${search}%`, limit, offset]);

            const formatData = result.map( row => ({
                product : JSON.parse( row.product ),
                stocks : JSON.parse( row.stocks )
            }));

            const parsedData = await strapi.service(STOCK).formatStockData( formatData );

            return {
                results : parsedData,
                pagination : {
                    page : parseInt( page ),
                    pageSize : limit,
                    pageCount: Math.ceil(total / limit),
                    total,
                },
            };
        } catch (e) {
            console.log(e);

            throw new BadRequestError("Error while getting stock", {
                key: "stock.sqlError",
                path: ctx.request.url,
            });
        }
    },

    async getStockByEntity(ctx) {
        const { locationUuid } = ctx.params;
        const { product, variation, badge, package } = ctx.query;

        const location = await findOneByUuid( locationUuid, STOCK_LOCATION );

        if (package) {
            const { id : packageId } = await findOneByUuid( package, PACKAGE );

            const stocks = await findMany( STOCK, stockFields, {
                package : packageId,
                location : location.id,
            }, false );

            return stocks;
        }

        if (badge) {
            const { id : badgeId } = await findOneByUuid( badge, PRODUCT_BADGE );

            const stocks = await findMany( STOCK, stockFields, {
                badge : badgeId,
                location : location.id,
            }, false );

            return stocks;
        }

        if (variation) {
            const { id : variationId } = await findOneByUuid( variation, PRODUCT_VARIATION );

            const stocks = await findMany( STOCK, stockFields, {
                variation : variationId,
                location : location.id,
            }, false );

            return stocks;
        }

        if (product) {
            const { id : productId } = await findOneByUuid( product, PRODUCT );

            const stocks = await findMany( STOCK, stockFields, {
                product : productId,
                location : location.id,
            }, false );

            return stocks;
        }

        const stocks = await findMany( STOCK, stockFields, {
            location : location.id,
        }, false );

        return stocks;
    },
}));
