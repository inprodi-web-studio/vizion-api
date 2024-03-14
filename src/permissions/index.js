const models = require("../constants/models");
const roles  = require("./roles");

delete models.ROLE;

const permissionsParser = (ROLE) => {
    const modelObject = {};

    for ( const MODEL of Object.values( models ) ) {
        const PARSED_MODEL = MODEL.split(".");
        PARSED_MODEL.pop();

        const INDIVIDUAL_MODEL = PARSED_MODEL.join(".").split("::")[1];

        const controllersObject = {};

        modelObject[PARSED_MODEL.join(".")] = {
            controllers : {},
        };

        if ( !roles[ROLE].permissions[MODEL] ) {
            continue;
        }

        if ( !Array.isArray( roles[ROLE].permissions[MODEL] ) ) {
            const keys = Object.keys( roles[ROLE].permissions[MODEL] );

            for ( const subModule of keys ) {
                controllersObject[subModule] = {};

                for ( const controller of roles[ROLE].permissions[MODEL][subModule] ) {
                    controllersObject[subModule][controller] = {
                        enabled : true,
                        policy: "",
                    };
                }
            }

            modelObject[PARSED_MODEL.join(".")].controllers = controllersObject;
        } else {
            for ( const controller of roles[ROLE].permissions[MODEL] ?? [] ) {
                controllersObject[controller] = {
                    enabled : true,
                    policy: "",
                };
            }

            modelObject[PARSED_MODEL.join(".")].controllers[INDIVIDUAL_MODEL] = controllersObject;
        }
    }

    return modelObject;
};

module.exports = permissionsParser;