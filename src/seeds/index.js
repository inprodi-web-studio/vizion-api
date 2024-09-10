const {
    ROLE,
    USER,
    PRODUCT,
} = require("../constants/models");

const generateRoles = require("./roles");

const generateSeeds = async (strapi) => {
    console.log("Seed data has started...");

    // console.log("Deleting old data...");

    // const contentTypes = [
    //     ROLE,
    // ];

    // for (const contentType of contentTypes) {
    //     console.log(`Deleting ${contentType}...`);
    
    //       await strapi.query(contentType).deleteMany({
    //         where : {
    //             id : {
    //                 $not : null
    //             },
    //         },
    //     });
    // }

    // console.log("Old data has been deleted!");

    console.log("Generating new data...");

    const companyProducts = await strapi.query( PRODUCT ).findMany({
        where : {
            company : {
                uuid : "a8513a90-326f-4584-bc40-4ad4ba0d10e4",
            },
            unity : {
                $null : true,
            },
        },
    });

    console.log( companyProducts );

    for ( const product of companyProducts ) {
        await strapi.entityService.update( PRODUCT, product.id, {
            data : {
                unity : 1,
            },
        });
    }

    console.log("FINISHED!");

    // await generateRoles(strapi);
}

module.exports = generateSeeds;