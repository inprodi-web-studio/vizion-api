const {
    TAG,
    USER,
    LEAD,
    INVITATION,
    CONTACT_GROUP,
    CONTACT_SOURCE,
    CUSTOMER,
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
                user : ["find", "me", "toggle", "delete"],
            },
            [TAG]            : ["find", "create", "update", "delete"],
            [LEAD]           : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete", "uploadFile", "getFiles", "removeFile", "createTask", "getTasks", "updateTask", "toggleTask", "deleteTask", "getNotes", "createNote", "updateNote", "deleteNote", "getInteracitons", "createInteraction", "deleteInteraction", "getInsiders", "createInsider", "updateInsider", "deleteInsider"],
            [CUSTOMER]       : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete", "uploadFile", "getFiles", "removeFile", "createTask", "getTasks", "updateTask", "toggleTask", "deleteTask", "getNotes", "createNote", "updateNote", "deleteNote", "getInteracitons", "createInteraction", "deleteInteraction", "getInsiders", "createInsider", "updateInsider", "deleteInsider"],
            [INVITATION]     : ["find", "create", "delete"],
            [CONTACT_GROUP]  : ["find", "create", "update", "delete"],
            [CONTACT_SOURCE] : ["find", "create", "update", "delete"],
        },
        meta : {
            type        : "owner",
            description : "owner",
        },
    },
    "admin" : {
        permissions : {
            [USER] : {
                user : ["find", "me", "toggle", "delete"],
            },
            [TAG]            : ["find", "create", "update", "delete"],
            [LEAD]           : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete"],
            [INVITATION]     : ["find", "create", "delete"],
            [CONTACT_GROUP]  : ["find", "create", "update", "delete"],
            [CONTACT_SOURCE] : ["find", "create", "update", "delete"],
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
            [TAG]            : ["find", "create", "update", "delete"],
            [LEAD]           : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete"],
            [CONTACT_GROUP]  : ["find", "create"],
            [CONTACT_SOURCE] : ["find", "create"],
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
            [TAG]            : ["find", "create"],
            [LEAD]           : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete"],
            [CONTACT_GROUP]  : ["find"],
            [CONTACT_SOURCE] : ["find"],
        },
        meta : {
            type        : "sales-agent",
            description : "sales-agent",
        },
    },
};

module.exports = roles;
