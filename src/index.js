const { uuid } = require("uuidv4");

const {
  TAG,
  USER,
  LEAD,
  TASK,
  NOTE,
  INSIDER,
  COMPANY,
  PRODUCT,
  CUSTOMER,
  DOCUMENT,
  INVITATION,
  PRICE_LIST,
  CONTACT_GROUP,
  ESTIMATE_STAGE,
  CONTACT_SOURCE,
  PRODUCT_CATEGORY,
  CONTACT_INTERACTION,
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
        PRICE_LIST,
        CONTACT_GROUP,
        ESTIMATE_STAGE,
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
