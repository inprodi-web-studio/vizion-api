const {
    ROLE,
    USER,
} = require("../constants/models");

const generateRoles = require("./roles");

const generateSeeds = async (strapi) => {
    console.log("Seed data has started...");

    console.log("Deleting old data...");

    const contentTypes = [
        ROLE,
    ];

    for (const contentType of contentTypes) {
        console.log(`Deleting ${contentType}...`);
    
          await strapi.query(contentType).deleteMany({
            where : {
                id : {
                    $not : null
                },
            },
        });
    }

    console.log("Old data has been deleted!");

    console.log("Generating new data...");
    await generateRoles(strapi);
}

module.exports = generateSeeds;