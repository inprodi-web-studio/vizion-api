const { uuid } = require("uuidv4");

const {
  TAG,
  USER,
  LEAD,
  TASK,
  COMPANY,
  DOCUMENT,
  INVITATION,
  CONTACT_GROUP,
  CONTACT_SOURCE,
} = require("./constants/models");

module.exports = {
  register(/*{ strapi }*/) {},

  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      models : [
        TAG,
        USER,
        LEAD,
        TASK,
        COMPANY,
        DOCUMENT,
        INVITATION,
        CONTACT_GROUP,
        CONTACT_SOURCE,
      ],
      async beforeCreate( event ) {
        const { data } = event.params;

        data.uuid = uuid();
      },
    });
  },
};
