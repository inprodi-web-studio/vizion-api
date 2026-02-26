module.exports = {
    routes : [
        {
            method  : "GET",
            path    : "/product-families",
            handler : "product-family.find",
            config : {
                policies : ["global::userContext"],
            },
        },
        {
            method  : "POST",
            path    : "/product-families",
            handler : "product-family.create",
            config : {
                policies : ["global::userContext"],
            },
        },
        {
            method  : "PUT",
            path    : "/product-families/:uuid",
            handler : "product-family.update",
            config : {
                policies : ["global::userContext"],
            },
        },
        {
            method  : "DELETE",
            path    : "/product-families/:uuid",
            handler : "product-family.delete",
            config : {
                policies : ["global::userContext"],
            },
        },
    ],
};
