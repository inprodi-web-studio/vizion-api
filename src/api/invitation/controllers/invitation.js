const {
    USER,
    INVITATION,
} = require('../../../constants/models');

const checkForDuplicates = require('../../../helpers/checkForDuplicates');
const findMany = require('../../../helpers/findMany');
const findOneByUuid = require('../../../helpers/findOneByUuid');
const { validateCreate } = require('../content-types/invitation/invitation.validation');

const { createCoreController } = require('@strapi/strapi').factories;

const invitationFields = {
    fields : ["uuid", "name", "lastName", "email", "role", "createdAt"],
};

module.exports = createCoreController( INVITATION, ({ strapi }) => ({
    async find(ctx) {
        const user  = ctx.state.user;

        const filters = {
            $search : [
                "name",
                "lastName",
                "email",
            ],
        };

        const invitations = await findMany( INVITATION, invitationFields, filters );

        return invitations;
    },
    
    async create(ctx) {
        const { user, company } = ctx.state;
        const data = ctx.request.body;

        await validateCreate( data );

        await checkForDuplicates( INVITATION, [
            {
                email : data.email,
            },
        ], invitationFields);

        await checkForDuplicates( USER, [
            {
                email : data.email,
            }
        ], invitationFields);

        const newInvitation = await strapi.entityService.create( INVITATION, {
            data : {
                ...data,
                invitedBy : user.id,
                company   : company.id,
            },
            ...invitationFields
        });

        return newInvitation;
    },

    async delete(ctx) {
        const { uuid } = ctx.params;

        const { id } = await findOneByUuid( uuid, INVITATION );

        const deletedInvitation = await strapi.entityService.delete( INVITATION, id, invitationFields );

        return deletedInvitation;
    },
}));
