module.exports = ({ env }) => ({
  host : env("HOST", "0.0.0.0"),
  port : env.int("PORT", 1337),
  proxy : true,
  cron : {
    enabled : true,
  },
  app : {
    keys: env.array("APP_KEYS"),
  },
  webhooks : {
    populateRelations : env.bool("WEBHOOKS_POPULATE_RELATIONS", false),
  },
});
