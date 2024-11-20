const { STOCK, WAREHOUSE, STOCK_LOCATION } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const product = require('../../product/controllers/product');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(STOCK, ({ strapi }) => ({
    async find(ctx) {
        const {uuid, locationUuid} = ctx.params;

        await findOneByUuid( uuid, WAREHOUSE );

        const location = await findOneByUuid( locationUuid, STOCK_LOCATION );

        try {
            const [ result ] = await strapi.db.connection.raw(`
                SELECT
                    JSON_OBJECT(
                        'uuid', p.uuid,
                        'name', p.name
                    ) AS product,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'uuid', s.uuid,
                            'quantity', s.quantity,
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
                                'sku', pv.sku
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
                    LEFT JOIN stocks_badge_links AS sbl ON s.id = sbl.stock_id
                    LEFT JOIN product_badges AS pb ON sbl.product_badge_id = pb.id
                    LEFT JOIN stocks_package_links AS spacl ON s.id = spacl.stock_id
                    LEFT JOIN packages AS pac ON spacl.package_id = pac.id
                    LEFT JOIN packages_unity_links AS pul ON pac.id = pul.package_id
                    LEFT JOIN unities AS upac ON pul.unity_id = upac.id
                    LEFT JOIN stocks_variation_links AS svl ON s.id = svl.stock_id
                    LEFT JOIN product_variations AS pv ON svl.product_variation_id = pv.id
                WHERE
                    sl.id = ?
                GROUP BY
                    p.id
                LIMIT 30;
            `, [location.id]);

            return result.map( row => ({
                product : JSON.parse( row.product ),
                stocks : JSON.parse( row.stocks )
            }));
        } catch (e) {
            console.log(e);

            throw new BadRequestError("Error while getting stock", {
                key: "stock.sqlError",
                path: ctx.request.url,
            });
        }
    },
}));
