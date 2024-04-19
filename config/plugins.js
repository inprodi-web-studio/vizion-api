module.exports = ({ env }) => ({
    "file-system" : {
        enabled: true,
    },
    email : {
        config : {
            provider        : "nodemailer",
            providerOptions : {
                host   : env("SMTP_HOST", "smtp.hostinger.com"),
                port   : env("SMTP_PORT", 465),
                auth   : {
                    user : env("SMTP_USERNAME"),
                    pass : env("SMTP_PASSWORD"),
                },
            },
            settings : {
                defaultFrom    : "Vizion <hola@inprodi.com.mx>",
                defaultReplyTo : "hola@inprodi.com.mx",
            },
        },
    },
    upload: {
        config: {
          provider: "strapi-provider-upload-do", 
          providerOptions: {
            key      : env("DO_ACCESS_KEY"),
            secret   : env("DO_SECRET_KEY"),
            endpoint : env("DO_ENDPOINT"),
            space    : env("DO_BUCKET"),
          }
        },
      },
});