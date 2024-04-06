module.exports = [
  "strapi::logger",
  "strapi::errors",
  "strapi::cors",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
  "global::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src" : ["'self'", 'https:'],
          "img-src" : [
            "'self'",
            "data:",
            "blob:",
            "dl.airtable.com",
            "*.digitaloceanspaces.com",
          ],
          "media-src" : [
            "'self'",
            "data:",
            "blob:",
            "dl.airtable.com",
            "*.digitaloceanspaces.com",
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name   : "strapi::poweredBy",
    config : {
      poweredBy : "Core Vizion Technologies",
    },
  },
];
