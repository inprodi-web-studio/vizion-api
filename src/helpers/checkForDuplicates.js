const { ConflictError } = require("./errors");

const checkForDuplicates = async (MODEL, filters, schema, byCompany = true) => {
    const ctx     = strapi.requestContext.get();
    const company = ctx.state.company;
    const method  = ctx.request.method;

    const individualModel = MODEL.split(".")[1];

    const conflictingEntity = await strapi.query( MODEL ).findOne({
        where: {
            $or : filters,
            ...( byCompany && company && {
                company : company.id
            }),
            ...( method === "PUT" && {
                uuid : {
                    $not: ctx.params.uuid
                },
            }),
        },
        ...schema,
    });

    const checkFilters = ( filter, entity, path = "" ) => {
        const keys = Object.keys( filter );

        if ( keys.length > 1 ) {
            let isIdentical = true;

            for ( const subKey of keys ) {
                if ( entity[subKey] !== filter[subKey] ) {
                    isIdentical = false;
                    break;
                }
            }

            if ( isIdentical ) {
                throw new ConflictError( `${ individualModel } with ${ path } already exists`, {
                    key: `${ individualModel }.duplicated_${ path }`,
                    path: ctx.request.path,
                });
            }

        } else {
            const value   = filter[ keys[0] ];
            const newPath = path ? `${path}.${keys[0]}` : keys[0];

            if ( typeof value === "object" && value !== null && !Array.isArray( value ) ) {
                checkFilters( value, entity[keys[0]], newPath);
            } else {
                if ( entity[keys[0]] === value ) {
                    throw new ConflictError( `${ individualModel } with ${ newPath } of ${ value } already exists`, {
                        key: `${ individualModel }.duplicated_${ newPath }`,
                        path: ctx.request.path,
                    });
                }
            }
        }
    };

    if ( conflictingEntity?.id ) {
        for ( const filter of filters ) {
            checkFilters( filter, conflictingEntity );
        }
    }
};


module.exports = checkForDuplicates;