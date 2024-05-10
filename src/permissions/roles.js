const {
    TAG,
    USER,
    LEAD,
    PRODUCT,
    COMPANY,
    CUSTOMER,
    INVITATION,
    PRICE_LIST,
    CONTACT_GROUP,
    CONTACT_SOURCE,
    PRODUCT_CATEGORY,
    ESTIMATE_STAGE,
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
            [PRODUCT]          : ["find", "create", "update", "keyUpdate", "toggleStatus", "setPricing", "setUpsells", "delete"],
            [CUSTOMER]         : ["find", "findOne", "create", "update", "toggle", "keyUpdate", "delete", "uploadFile", "getFiles", "removeFile", "createTask", "getTasks", "updateTask", "toggleTask", "deleteTask", "getNotes", "createNote", "updateNote", "deleteNote", "getInteracitons", "createInteraction", "deleteInteraction", "getInsiders", "createInsider", "updateInsider", "deleteInsider"],
            [PRICE_LIST]       : ["find", "create", "update", "delete"],
            [ESTIMATE_STAGE]   : ["find", "create", "update", "delete"],
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
