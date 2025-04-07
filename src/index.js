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
  INT_ROLE,
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
  STOCK_LOCATION,
  STOCK,
  PRODUCT_BADGE,
  STOCK_MOVEMENT,
  ADJUSTMENT_MOTIVE,
  SHELF,
  SHELF_POSITION,
  STOCK_DISPATCH,
  STOCK_RESERVATION,
  STOCK_RELEASE,
  DISPATCH,
  PLATFORM,
  BRAND,
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
        BRAND,
        UNITY,
        STOCK,
        SHELF,
        PACKAGE,
        PRODUCT,
        INSIDER,
        COMPANY,
        PAYMENT,
        PLATFORM,
        CUSTOMER,
        DISPATCH,
        DOCUMENT,
        INT_ROLE,
        ESTIMATE,
        WAREHOUSE,
        INVITATION,
        PRICE_LIST,
        PREFERENCE,
        PRODUCT_BADGE,
        CONTACT_GROUP,
        STOCK_RELEASE,
        STOCK_DISPATCH,
        STOCK_MOVEMENT,
        ESTIMATE_STAGE,
        CONTACT_SOURCE,
        STOCK_LOCATION,
        SHELF_POSITION,
        CREDIT_MOVEMENT,
        ATTRIBUTE_VALUE,
        CUSTOMER_CREDIT,
        PRODUCT_CATEGORY,
        STOCK_RESERVATION,
        ADJUSTMENT_MOTIVE,
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
