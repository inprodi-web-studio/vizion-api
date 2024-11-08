const { uuid } = require("uuidv4");

const {
  TAG,
  USER,
  LEAD,
  TASK,
  NOTE,
  SALE,
  INSIDER,
  COMPANY,
  PRODUCT,
  CUSTOMER,
  DOCUMENT,
  ESTIMATE,
  INVITATION,
  PRICE_LIST,
  PREFERENCE,
  CONTACT_GROUP,
  ESTIMATE_STAGE,
  CONTACT_SOURCE,
  ATTRIBUTE_VALUE,
  PRODUCT_CATEGORY,
  PRODUCT_VARIATION,
  PRODUCT_ATTRIBUTE,
  CONTACT_INTERACTION,
  UNITY,
  PACKAGE,
  CUSTOMER_CREDIT,
  CREDIT_MOVEMENT,
  PAYMENT,
  WAREHOUSE,
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
        SALE,
        UNITY,
        PACKAGE,
        PRODUCT,
        INSIDER,
        COMPANY,
        PAYMENT,
        CUSTOMER,
        DOCUMENT,
        ESTIMATE,
        WAREHOUSE,
        INVITATION,
        PRICE_LIST,
        PREFERENCE,
        CONTACT_GROUP,
        ESTIMATE_STAGE,
        CONTACT_SOURCE,
        CREDIT_MOVEMENT,
        ATTRIBUTE_VALUE,
        CUSTOMER_CREDIT,
        PRODUCT_CATEGORY,
        PRODUCT_ATTRIBUTE,
        PRODUCT_VARIATION,
        CONTACT_INTERACTION,
      ],
      async beforeCreate( event ) {
        const { data } = event.params;

        data.uuid = uuid();
      },
    });
  },
};
