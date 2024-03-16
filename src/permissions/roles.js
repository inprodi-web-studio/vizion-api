const {
    USER,
    LEAD,
    CONTACT_GROUP,
} = require("../constants/models");

const roles = {
    public : {
        permissions : {
            [USER] : {
                auth : ["login", "register", "validateCode"],
            },
        },
        meta : {
            type        : "public",
            description : "public",
        },
    },
    "owner" : {
        permissions : {
            [USER] : {
                user : ["find", "me"],
            },
            [LEAD] : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete"],
            [CONTACT_GROUP] : ["find", "findOne", "create", "update", "delete"],
        },
        meta : {
            type        : "owner",
            description : "owner",
        },
    },
    "admin" : {
        permissions : {
            [USER] : {
                user : ["find", "me"],
            },
            [LEAD] : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete"],
            [CONTACT_GROUP] : ["find", "findOne", "create", "update", "delete"],
        },
        meta : {
            type        : "super-admin",
            description : "super-admin",
        },
    },
    "sales-manager" : {
        permissions : {
            [USER] : {
                user : ["find", "me"],
            },
            [LEAD] : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete"],
            [CONTACT_GROUP] : ["find", "findOne", "create"],
        },
        meta : {
            type        : "sales-manager",
            description : "sales-manager",
        },
    },
    "sales-agent" : {
        permissions : {
            [USER] : {
                user : ["find", "me"],
            },
            [LEAD] : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete"],
            [CONTACT_GROUP] : ["find", "findOne"],
        },
        meta : {
            type        : "sales-agent",
            description : "sales-agent",
        },
    },
};

module.exports = roles;
