const { PRODUCT, ESTIMATE, SALE, DOCUMENT } = require("../../../constants/models");
const checkForDuplicates = require("../../../helpers/checkForDuplicates");
const { UnprocessableContentError, BadRequestError } = require("../../../helpers/errors");
const findMany = require("../../../helpers/findMany");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { validateKeyUpdate }    = require('../../../helpers/validateKeyUpdate');
const { validateCreate, validateSetPricing, validateSetUpsells, validateUpdate } = require("../content-types/product/product.validation");

const { createCoreController } = require("@strapi/strapi").factories;

const productFields = {
    fields : ["uuid", "name", "sku", "type", "isDraft", "description", "url", "satCode", "taxType", "createdAt"],
    populate : {
        images : {
            fields : ["url", "name", "size", "mime"],
        },
        category : {
            fields : ["uuid", "name", "icon", "color"],
        },
        brand : {
            fields : ["uuid", "name"],
        },
        attributes : {
            populate : {
                attribute : true,
                values    : true,
            },
        },
        unity : {
            fields : ["uuid", "name", "satCode", "abbreviation"],
        },
        dimensions   : true,
        saleInfo     : {
            fields : "*",
            populate : {
                priceConfig : true,
                upsells     : {
                    fields : ["uuid", "name", "sku", "description"],
                    populate : {
                        images : {
                            fields : ["url"],
                        },
                        category : {
                            fields : ["uuid", "name", "icon", "color"],
                        },
                        saleInfo : {
                            fields : "*",
                            populate : {
                                priceConfig : true,
                            }
                        },
                    },
                },
            },
        },
        purchaseInfo : true,
        stockInfo    : {
            fields : "*",
            populate : {
                alertTo : {
                    fields : ["uuid", "name", "middleName", "lastName"],
                    populate : {
                        image : {
                            fields : ["url"],
                        },
                    },
                },
            },
        },
        tags : true,
        variations : {
            count : true,
        },
        packages : {
            count : true,
        },
        createdByUser : {
            fields : ["uuid", "name", "middleName", "lastName"],
            populate : {
                image : {
                    fields : ["url"],
                },
            },
        },
    },
};

module.exports = createCoreController( PRODUCT, ({ strapi }) => ({
    async find(ctx) {
        const filters = {
            $search : [
                "name",
                "sku",
                "description",
            ],
        };

        const products = await findMany( PRODUCT, productFields, filters );

        return products;
    },

    async findOne(ctx) {
        const { uuid } = ctx.params;

        const product = await findOneByUuid( uuid, PRODUCT, productFields );

        return product;
    },

    async create(ctx) {
        const { company, user } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( PRODUCT, [
            {
                sku : data.sku,
            },
        ]);

        await strapi.service( PRODUCT ).validateParallelData( data );

        const newProduct = await strapi.entityService.create( PRODUCT, {
            data : {
                ...data,
                saleInfo : {
                    ...data.saleInfo,
                    priceConfig : {
                        type : "fixed",
                    },
                },
                createdByUser : user.id,
                company : company.id,
            },
        });

        return newProduct;
    },

    async update(ctx) {
        const { uuid } = ctx.params;
        const data = ctx.request.body;

        await validateUpdate( data );

        const product = await findOneByUuid( uuid, PRODUCT, productFields );

        await checkForDuplicates( PRODUCT, [
            {
                name : data.name,
            },
            {
                sku : data.sku,
            },
        ]);

        await strapi.service( PRODUCT ).validateParallelData( data );

        const updatedProduct = await strapi.entityService.update( PRODUCT, product.id, {
            data : {
                ...data,
                saleInfo : {
                    ...data.saleInfo,
                    priceConfig : product.saleInfo?.priceConfig,
                },
            },
            ...productFields
        });

        return updatedProduct;
    },

    async keyUpdate(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateKeyUpdate( data );

        const { id, tags } = await findOneByUuid( uuid, PRODUCT, productFields );

        const entityId = await strapi.service( PRODUCT ).keyFind( data, tags );

        const updatedProduct = await strapi.entityService.update( PRODUCT, id, {
            data : {
                [data.key] : entityId,
            },
            ...productFields
        });

        return updatedProduct;
    },

    async setPricing(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateSetPricing( data );

        const { id, saleInfo } = await findOneByUuid( uuid, PRODUCT, productFields );

        const updatedProduct = await strapi.entityService.update( PRODUCT, id, {
            data : {
                saleInfo : {
                    ...saleInfo,
                    priceConfig : data,
                }
            },
            ...productFields,
        });

        return updatedProduct;
    },

    async setUpsells(ctx) {
        const data = ctx.request.body;
        const { uuid } = ctx.params;

        await validateSetUpsells( data );

        const { id, saleInfo } = await findOneByUuid( uuid, PRODUCT, productFields );

        const upsells = await strapi.service( PRODUCT ).validateUpsells( data );

        const updatedProduct = await strapi.entityService.update( PRODUCT, id, {
            data : {
                saleInfo : {
                    ...saleInfo,
                    upsells,
                }
            },
            ...productFields,
        });

        return updatedProduct;
    },

    async toggleStatus(ctx) {
        const { uuid } = ctx.params;

        const { id, isDraft, type, variations } = await findOneByUuid( uuid, PRODUCT, productFields );

        if (isDraft && type === "variable" && variations.count === 0) {
            throw new BadRequestError("The product must have at least one variation to be published", {
                key : "product.needsVariations",
                path : ctx.request.url,
            });
        }

        if (!isDraft && type === "variable" && variations.count > 0) {
            await strapi.service( PRODUCT ).unpublishVariations( id );
        }

        const updatedProduct = await strapi.entityService.update( PRODUCT, id, {
            data : {
                isDraft : !isDraft,
            },
            ...productFields
        });

        return updatedProduct;
    },

    async getFiles(ctx) {
        const { uuid }   = ctx.params;
        const { search } = ctx.query ?? {};

        const product = await findOneByUuid( uuid, PRODUCT, {
            populate : {
                documents : {
                    fields   : ["uuid", "name"],
                    populate : {
                        user : {
                            fields   : ["name, middleName, lastName"],
                            populate : {
                                image : {
                                    fields : ["url"],
                                },
                            },
                        },
                        file : true,
                    },
                },
            },
        });

        return search ? product.documents.filter( doc => doc.file.name.toLowerCase().includes( search.toLowerCase() ) ) : product.documents ?? [];
    },
    
    async uploadFile(ctx) {
        const { user } = ctx.state;
        const { uuid } = ctx.params;
        const { file } = ctx.request.files ?? {};

        if ( !file ) {
            throw new UnprocessableContentError(["File is required"]);
        }

        const product = await findOneByUuid( uuid, PRODUCT, productFields );

        const newDocument = await strapi.entityService.create( DOCUMENT, {
            data : {
                name : file.name,
                user : user.id,
            },
        });

        await strapi.plugins.upload.services.upload.uploadToEntity({
            id    : newDocument.id,
            model : DOCUMENT,
            field : "file",
        }, file );

        const updatedProduct = await strapi.entityService.update( PRODUCT, product.id, {
            data : {
                documents : {
                    connect : [ newDocument.id ],
                },
            },
            fields : ["uuid"],
            populate : {
                documents : {
                    fields : ["uuid"],
                    populate : {
                        user : {
                            fields   : ["name, middleName, lastName"],
                            populate : {
                                image : {
                                    fields : ["url"],
                                },
                            },
                        },
                        file : true,
                    }
                },
            }
        });

        return updatedProduct;
    },

    async updateFileName(ctx) {
        const data = ctx.request.body;
        const { uuid, documentUuid } = ctx.params;

        await findOneByUuid( uuid, PRODUCT );

        const { id } = await findOneByUuid( documentUuid, DOCUMENT);

        const updatedDocument = await strapi.entityService.update( DOCUMENT, id, {
            data : {
                name : data.name
            },
        });

        return updatedDocument;
    },

    async removeFile(ctx) {
        const { uuid, documentUuid } = ctx.params;

        await findOneByUuid( uuid, PRODUCT );

        const { id, file } = await findOneByUuid( documentUuid, DOCUMENT, {
            populate : {
                file : true,
            },
        });

        await strapi.plugins.upload.services.upload.remove( file );

        const deletedDocument = await strapi.entityService.delete( DOCUMENT, id, {
            fields : ["uuid"],
        });

        return deletedDocument;
    },

    async findEstimatesAndSales(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, PRODUCT, productFields );

        const estimates = await strapi.query( ESTIMATE ).count({
            where : {
                versions : {
                    items : {
                        product : id,
                    },
                },
            },
        });

        const sales = await strapi.query( SALE ).count({
            where : {
                items : {
                    product : id,
                },
            },
        });

        return {
            estimates,
            sales,
        };
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, PRODUCT, productFields );

        const deletedProduct = await strapi.entityService.delete( PRODUCT, id, productFields );

        return deletedProduct;
    },

    async export(ctx) {
        const { company } = ctx.state;

        const fields = {
            fields : ["name", "sku"],
            populate : {
                saleInfo : {
                    fields : ["price"],
                },
            },
        };

        const pageSize = 100;
        let page = 1;
        let pageCount = 1;
        const products = [];

        do {
            const { results, pagination } = await strapi.service( PRODUCT ).find({
                ...fields,
                filters : {
                    company : company.id,
                },
                pagination : {
                    page,
                    pageSize,
                },
            });

            products.push( ...results );

            pageCount = pagination?.pageCount ?? 1;
            page += 1;
        } while ( page <= pageCount );

        const escapeCsv = ( value ) => {
            if ( value === null || value === undefined ) return "";

            const str = String( value );

            if ( /[",\n\r]/.test( str ) ) {
                return `"${ str.replace( /"/g, '""' ) }"`;
            }

            return str;
        };

        const rows = [
            ["Nombre", "SKU", "Precio"],
            ...products.map( ( product ) => ([
                escapeCsv( product.name ),
                escapeCsv( product.sku ),
                escapeCsv( product.saleInfo?.price ),
            ]) ),
        ];

        const csv = rows.map( row => row.join( "," ) ).join( "\n" );

        const filename = `products.csv`;

        ctx.set( "Content-Type", "text/csv; charset=utf-8" );
        ctx.set( "Content-Disposition", `attachment; filename="${ filename }"` );
        ctx.body = csv;
    },
}));
