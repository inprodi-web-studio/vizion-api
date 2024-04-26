const { uuid } = require("uuidv4");

const {
  TAG,
  USER,
  LEAD,
  TASK,
  NOTE,
  INSIDER,
  COMPANY,
  CUSTOMER,
  DOCUMENT,
  INVITATION,
  CONTACT_GROUP,
  CONTACT_SOURCE,
  CONTACT_INTERACTION,
  PRODUCT,
  PRODUCT_CATEGORY,
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
        NOTE,
        PRODUCT,
        INSIDER,
        COMPANY,
        CUSTOMER,
        DOCUMENT,
        INVITATION,
        CONTACT_GROUP,
        CONTACT_SOURCE,
        PRODUCT_CATEGORY,
        CONTACT_INTERACTION,
      ],
      async beforeCreate( event ) {
        const { data } = event.params;

        data.uuid = uuid();
      },
    });
  },
};
