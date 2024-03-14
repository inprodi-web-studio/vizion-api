const { uuid } = require("uuidv4");

const {
  USER,
  LEAD,
  COMPANY,
} = require("./constants/models");

module.exports = {
  register(/*{ strapi }*/) {},

  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      models : [
        USER,
        LEAD,
        COMPANY,
      ],
      async beforeCreate( event ) {
        const { data } = event.params;

        data.uuid = uuid();
      },
    });
  },
};
