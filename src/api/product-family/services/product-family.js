const { PRODUCT_FAMILY } = require("../../../constants/models");
const findOneByUuid = require("../../../helpers/findOneByUuid");
const { BadRequestError, ConflictError } = require("../../../helpers/errors");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService( PRODUCT_FAMILY, ({ strapi }) => ({
    async resolveParentByUuid(parentUuid) {
        if (!parentUuid) return null;

        return await findOneByUuid( parentUuid, PRODUCT_FAMILY, {
            fields : ["uuid", "name"],
            populate : {
                parentId : {
                    fields : ["uuid"],
                },
            },
        });
    },

    async validateParent(parentFamily, currentFamily = null) {
        const ctx = strapi.requestContext.get();

        if (!parentFamily) return;

        if (currentFamily && currentFamily.id === parentFamily.id) {
            throw new BadRequestError("A family cannot be its own parent", {
                key  : "product-family.invalidParent",
                path : ctx.request.path,
            });
        }

        if (parentFamily.parentId) {
            throw new BadRequestError("Only one level of subfamilies is allowed", {
                key  : "product-family.invalidDepth",
                path : ctx.request.path,
            });
        }

        if (!currentFamily) return;

        const hasChildren = await strapi.query(PRODUCT_FAMILY).count({
            where : {
                parentId : currentFamily.id,
            },
        });

        if (hasChildren > 0) {
            throw new BadRequestError(
                "A family with subfamilies cannot be converted into a subfamily",
                {
                    key  : "product-family.invalidMove",
                    path : ctx.request.path,
                }
            );
        }
    },

    async validateDuplicateName(name, parentId, excludeUuid = null) {
        const ctx = strapi.requestContext.get();
        const { company } = ctx.state;

        const duplicated = await strapi.query(PRODUCT_FAMILY).findOne({
            where : {
                name,
                company : company.id,
                ...( parentId ? { parentId } : { parentId : null } ),
                ...( excludeUuid && {
                    uuid : {
                        $not : excludeUuid,
                    },
                }),
            },
        });

        if (duplicated?.id) {
            throw new ConflictError(
                `product-family with name ${ name } already exists in this level`,
                {
                    key  : "product-family.duplicated_name",
                    path : ctx.request.path,
                }
            );
        }
    },

    formatTree(families = []) {
        const familyMap = new Map();

        for (const family of families) {
            familyMap.set(family.uuid, {
                uuid     : family.uuid,
                name     : family.name,
                parentId : family.parentId?.uuid ?? null,
                children : [],
            });
        }

        const roots = [];

        for (const family of familyMap.values()) {
            if (family.parentId && familyMap.has(family.parentId)) {
                familyMap.get(family.parentId).children.push(family);
                continue;
            }

            roots.push(family);
        }

        const sortByName = (a, b) => a.name.localeCompare(b.name);

        for (const family of familyMap.values()) {
            family.children.sort(sortByName);
        }

        roots.sort(sortByName);

        return roots;
    },

    filterTreeBySearch(familyTree, search) {
        const normalizedSearch = String(search ?? "").trim().toLowerCase();

        if (!normalizedSearch) return familyTree;

        return familyTree.reduce((acc, family) => {
            const parentMatches = family.name.toLowerCase().includes(normalizedSearch);
            const matchingChildren = family.children.filter((child) =>
                child.name.toLowerCase().includes(normalizedSearch)
            );

            if (!parentMatches && matchingChildren.length === 0) {
                return acc;
            }

            acc.push({
                ...family,
                children : parentMatches ? family.children : matchingChildren,
            });

            return acc;
        }, []);
    },
}));
