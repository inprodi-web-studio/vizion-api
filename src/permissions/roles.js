const {
    USER,
    LEAD,
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
                user : ["find"],
            },
            [LEAD] : ["find", "findOne", "create", "update", "keyUpdate", "delete"],
        },
        meta : {
            type        : "owner",
            description : "owner",
        },
    },
    "admin" : {
        permissions : {
            [USER] : {
                user : ["find"],
            },
            [LEAD] : ["find", "findOne", "create", "update", "keyUpdate", "delete"],
        },
        meta : {
            type        : "super-admin",
            description : "super-admin",
        },
    },
    "sales-manager" : {
        permissions : {
            [USER] : {
                user : ["find"],
            },
            [LEAD] : ["find", "findOne", "create", "update", "keyUpdate", "delete"],
        },
        meta : {
            type        : "sales-manager",
            description : "sales-manager",
        },
    },
    "sales-agent" : {
        permissions : {
            [USER] : {
                user : ["find"],
            },
            [LEAD] : ["find", "findOne", "create", "update", "keyUpdate", "delete"],
        },
        meta : {
            type        : "sales-agent",
            description : "sales-agent",
        },
    },
};

module.exports = roles;
