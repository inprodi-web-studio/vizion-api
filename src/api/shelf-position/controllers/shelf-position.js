const { SHELF_POSITION, SHELF } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findOneByUuid = require('../../../helpers/findOneByUuid');

const { createCoreController } = require('@strapi/strapi').factories;

const positionFields = {
    fields : ["uuid", "xPosition", "yPosition", "rotation", "partitions"],
};

module.exports = createCoreController(SHELF_POSITION, ({ strapi }) => ({
    async findOne(ctx) {
        const { uuid } = ctx.params;
        const { xPosition, yPosition } = ctx.query ?? {};

        if ( !xPosition || !yPosition ) {
            throw new BadRequestError("xPosition and yPosition are required", {
                path : ctx.request.path,
                key  : "shelfPosition.missingParameters"
            });
        }

        const shelf = await findOneByUuid( uuid, SHELF );

        const position = await strapi.query( SHELF_POSITION ).findOne({
            where : {
                xPosition,
                yPosition,
                shelf : shelf.id,
            },
            select : positionFields.fields,
        });

        return position;
    },
}));
