const dayjs = require('dayjs');
const { DISPATCH, STOCK_DISPATCH } = require('../../../constants/models');
const { BadRequestError } = require('../../../helpers/errors');
const findMany = require('../../../helpers/findMany');

const { createCoreController } = require('@strapi/strapi').factories;

const dispatchFields = {
    fields : ["uuid", "fol", "startDate", "endDate"],
    populate : {
        stockDispatches : true
    },
};

module.exports = createCoreController( DISPATCH, ({ strapi }) => ({
    async find(ctx) {
        const company = ctx.state.company;

        const filters = {
            $search : [
                "fol"
            ],
        };

        const dispatches = await findMany( DISPATCH, dispatchFields, filters );

        return dispatches;
    },

    async create(ctx) {
        const company = ctx.state.company;

        const lastDispatch = await strapi.entityService.findMany( DISPATCH, {
            filters : {
                company : company.id
            },
            sort: ["createdAt:desc"],
            limit: 1,
            ...dispatchFields,
        });

        if ( lastDispatch[0] && !lastDispatch[0]?.endDate ) {
            throw new BadRequestError("Cant create a new dispatch, there is an open one", {
                key : "dispatch.openDispatch",
                path : ctx.request.path,
            });
        }

        const stockDispatches = await strapi.query( STOCK_DISPATCH ).findMany({
            where : {
                $or : [
                    {
                        createdAt : {
                            $lte : dayjs().toISOString(),
                            ...( lastDispatch.length > 0 && {
                                $gte : lastDispatch[0].createdAt,
                            }),
                        },
                    },
                    {
                        isCompleted : false
                    },
                ],
            },
        });

        if ( stockDispatches.length === 0 ) {
            return {
                fol : -1
            };
        }

        const newDispatch = await strapi.entityService.create( DISPATCH, {
            data : {
                fol : lastDispatch.length > 0 ? lastDispatch[0].fol + 1 : 1,
                company : company.id,
                startDate : dayjs().toISOString(),
                stockDispatches : stockDispatches.map( dispatch => dispatch.id ),
            },
        }, dispatchFields );

        return newDispatch;
    },
}));