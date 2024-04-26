const {
    TAG,
    USER,
    LEAD,
    INVITATION,
    CONTACT_GROUP,
    CONTACT_SOURCE,
    CUSTOMER,
    COMPANY,
    PRODUCT_CATEGORY,
    PRODUCT,
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
                user : ["find", "me", "setProfileImage", "removeProfileImage", "updateProfile", "updatePassword", "toggle", "delete"],
            },
            [COMPANY]          : ["setLogotype", "removeLogotype"],
            [TAG]              : ["find", "create", "update", "delete"],
            [LEAD]             : ["find", "findOne", "create", "convert", "update", "toggle", "keyUpdate", "delete", "uploadFile", "getFiles", "removeFile", "createTask", "getTasks", "updateTask", "toggleTask", "deleteTask", "getNotes", "createNote", "updateNote", "deleteNote", "getInteracitons", "createInteraction", "deleteInteraction", "getInsiders", "createInsider", "updateInsider", "deleteInsider"],
            [PRODUCT]          : ["find", "create", "update", "delete"],
            [CUSTOMER]         : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete", "uploadFile", "getFiles", "removeFile", "createTask", "getTasks", "updateTask", "toggleTask", "deleteTask", "getNotes", "createNote", "updateNote", "deleteNote", "getInteracitons", "createInteraction", "deleteInteraction", "getInsiders", "createInsider", "updateInsider", "deleteInsider"],
            [INVITATION]       : ["find", "create", "delete"],
            [CONTACT_GROUP]    : ["find", "create", "update", "delete"],
            [CONTACT_SOURCE]   : ["find", "create", "update", "delete"],
            [PRODUCT_CATEGORY] : ["find", "create", "update", "delete"],
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
};

module.exports = roles;
