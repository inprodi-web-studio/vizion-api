const { ATTRIBUTE_VALUE, PRODUCT_ATTRIBUTE } = require('../../../constants/models');
const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/attribute-value/attribute-value.validation');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(ATTRIBUTE_VALUE, ({ strapi }) => ({
    async create(ctx) {
        const { company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        const attribute = await findOneByUuid( PRODUCT_ATTRIBUTE, data.attribute );

        await checkForDuplicates( ATTRIBUTE_VALUE, [
            {
                name : data.name,
            },
            {
                attribute : attribute.id,
            },
        ]);

        const newValue = await strapi.entityService.create( ATTRIBUTE_VALUE, {
            data : {
                name      : data.name,
                attribute : attribute.id,
                company   : company.id,
            },
        });

        return newValue;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateCreate( data );

        const value = await findOneByUuid( uuid, ATTRIBUTE_VALUE );

        await checkForDuplicates( ATTRIBUTE_VALUE, [
            {
                name : data.name,
            },
            {
                attribute : value.attribute,
            },
        ]);

        const updatedValue = await strapi.entityService.update( ATTRIBUTE_VALUE, value.id, {
            data : {
                name : data.name,
            },
        });

        return updatedValue;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const value = await findOneByUuid( uuid, ATTRIBUTE_VALUE );

        // TODO: Verificar que no haya variaciones ni productos asignados con este valor

        const deletedValue = await strapi.entityService.delete( ATTRIBUTE_VALUE, value.id );

        return deletedValue;
    },
}));
