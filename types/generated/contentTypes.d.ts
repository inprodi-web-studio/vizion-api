import type { Schema, Attribute } from '@strapi/strapi';

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    name: 'Permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    name: 'User';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    username: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    registrationToken: Attribute.String & Attribute.Private;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    preferedLanguage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    name: 'Role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    name: 'Api Token';
    singularName: 'api-token';
    pluralName: 'api-tokens';
    displayName: 'Api Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    name: 'API Token Permission';
    description: '';
    singularName: 'api-token-permission';
    pluralName: 'api-token-permissions';
    displayName: 'API Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    name: 'Transfer Token';
    singularName: 'transfer-token';
    pluralName: 'transfer-tokens';
    displayName: 'Transfer Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    name: 'Transfer Token Permission';
    description: '';
    singularName: 'transfer-token-permission';
    pluralName: 'transfer-token-permissions';
    displayName: 'Transfer Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    singularName: 'file';
    pluralName: 'files';
    displayName: 'File';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    alternativeText: Attribute.String;
    caption: Attribute.String;
    width: Attribute.Integer;
    height: Attribute.Integer;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    ext: Attribute.String;
    mime: Attribute.String & Attribute.Required;
    size: Attribute.Decimal & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    singularName: 'folder';
    pluralName: 'folders';
    displayName: 'Folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    singularName: 'release';
    pluralName: 'releases';
    displayName: 'Release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    timezone: Attribute.String;
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    singularName: 'release-action';
    pluralName: 'release-actions';
    displayName: 'Release Action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    contentType: Attribute.String & Attribute.Required;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    singularName: 'locale';
    pluralName: 'locales';
    collectionName: 'locales';
    displayName: 'Locale';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 50;
        },
        number
      >;
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    name: 'permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    name: 'role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    description: Attribute.String;
    type: Attribute.String & Attribute.Unique;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    name: 'user';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    company: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'api::company.company'
    >;
    name: Attribute.String & Attribute.Required;
    middleName: Attribute.String;
    lastName: Attribute.String;
    phone: Attribute.Component<'contact.phone'>;
    image: Attribute.Media;
    sessions: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::user-session.user-session'
    >;
    uuid: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiAdjustmentMotiveAdjustmentMotive
  extends Schema.CollectionType {
  collectionName: 'adjustment_motives';
  info: {
    singularName: 'adjustment-motive';
    pluralName: 'adjustment-motives';
    displayName: 'Adjustment Motive';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    title: Attribute.String;
    company: Attribute.Relation<
      'api::adjustment-motive.adjustment-motive',
      'oneToOne',
      'api::company.company'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::adjustment-motive.adjustment-motive',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::adjustment-motive.adjustment-motive',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiAttributeValueAttributeValue extends Schema.CollectionType {
  collectionName: 'attribute_values';
  info: {
    singularName: 'attribute-value';
    pluralName: 'attribute-values';
    displayName: 'Attribute Value';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    name: Attribute.String;
    attribute: Attribute.Relation<
      'api::attribute-value.attribute-value',
      'manyToOne',
      'api::product-attribute.product-attribute'
    >;
    variations: Attribute.Relation<
      'api::attribute-value.attribute-value',
      'manyToMany',
      'api::product-variation.product-variation'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::attribute-value.attribute-value',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::attribute-value.attribute-value',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCompanyCompany extends Schema.CollectionType {
  collectionName: 'companies';
  info: {
    singularName: 'company';
    pluralName: 'companies';
    displayName: 'Company';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    name: Attribute.String & Attribute.Required;
    isActive: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
    nich: Attribute.Relation<
      'api::company.company',
      'manyToOne',
      'api::company-niche.company-niche'
    >;
    logotype: Attribute.Media;
    size: Attribute.String;
    completedOnboarding: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    fiscalInfo: Attribute.Component<'fiscal.fiscal-info'>;
    address: Attribute.Component<'address.address'>;
    users: Attribute.Relation<
      'api::company.company',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    plan: Attribute.Relation<
      'api::company.company',
      'manyToOne',
      'api::suscription-plan.suscription-plan'
    >;
    payments: Attribute.Relation<
      'api::company.company',
      'oneToMany',
      'api::suscription-payment.suscription-payment'
    >;
    suscriptionStatus: Attribute.Relation<
      'api::company.company',
      'oneToOne',
      'api::suscription-status.suscription-status'
    >;
    urlParam: Attribute.String;
    website: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::company.company',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::company.company',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCompanyNicheCompanyNiche extends Schema.CollectionType {
  collectionName: 'company_niches';
  info: {
    singularName: 'company-niche';
    pluralName: 'company-niches';
    displayName: 'Company Niche';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    name: Attribute.String & Attribute.Required & Attribute.Unique;
    comapanies: Attribute.Relation<
      'api::company-niche.company-niche',
      'oneToMany',
      'api::company.company'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::company-niche.company-niche',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::company-niche.company-niche',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiContactGroupContactGroup extends Schema.CollectionType {
  collectionName: 'contact_groups';
  info: {
    singularName: 'contact-group';
    pluralName: 'contact-groups';
    displayName: 'Contact Group';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    icon: Attribute.String;
    color: Attribute.String;
    name: Attribute.String;
    leads: Attribute.Relation<
      'api::contact-group.contact-group',
      'oneToMany',
      'api::lead.lead'
    >;
    company: Attribute.Relation<
      'api::contact-group.contact-group',
      'oneToOne',
      'api::company.company'
    >;
    customers: Attribute.Relation<
      'api::contact-group.contact-group',
      'oneToMany',
      'api::customer.customer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::contact-group.contact-group',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::contact-group.contact-group',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiContactInteractionContactInteraction
  extends Schema.CollectionType {
  collectionName: 'contact_interactions';
  info: {
    singularName: 'contact-interaction';
    pluralName: 'contact-interactions';
    displayName: 'Contact Interaction';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    type: Attribute.String;
    content: Attribute.String;
    lead: Attribute.Relation<
      'api::contact-interaction.contact-interaction',
      'manyToOne',
      'api::lead.lead'
    >;
    user: Attribute.Relation<
      'api::contact-interaction.contact-interaction',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    company: Attribute.Relation<
      'api::contact-interaction.contact-interaction',
      'oneToOne',
      'api::company.company'
    >;
    customer: Attribute.Relation<
      'api::contact-interaction.contact-interaction',
      'manyToOne',
      'api::customer.customer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::contact-interaction.contact-interaction',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::contact-interaction.contact-interaction',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiContactSourceContactSource extends Schema.CollectionType {
  collectionName: 'contact_sources';
  info: {
    singularName: 'contact-source';
    pluralName: 'contact-sources';
    displayName: 'Contact Source';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    icon: Attribute.String;
    name: Attribute.String;
    leads: Attribute.Relation<
      'api::contact-source.contact-source',
      'oneToMany',
      'api::lead.lead'
    >;
    company: Attribute.Relation<
      'api::contact-source.contact-source',
      'oneToOne',
      'api::company.company'
    >;
    customers: Attribute.Relation<
      'api::contact-source.contact-source',
      'oneToMany',
      'api::customer.customer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::contact-source.contact-source',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::contact-source.contact-source',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCreditMovementCreditMovement extends Schema.CollectionType {
  collectionName: 'credit_movements';
  info: {
    singularName: 'credit-movement';
    pluralName: 'credit-movements';
    displayName: 'Credit Movement';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    sale: Attribute.Relation<
      'api::credit-movement.credit-movement',
      'oneToOne',
      'api::sale.sale'
    >;
    policy: Attribute.String;
    daysToPay: Attribute.Integer;
    payment: Attribute.Relation<
      'api::credit-movement.credit-movement',
      'oneToOne',
      'api::payment.payment'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::credit-movement.credit-movement',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::credit-movement.credit-movement',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCustomerCustomer extends Schema.CollectionType {
  collectionName: 'customers';
  info: {
    singularName: 'customer';
    pluralName: 'customers';
    displayName: 'Customer';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    completeName: Attribute.Component<'contact.complete-name'>;
    tradeName: Attribute.String;
    email: Attribute.String;
    phone: Attribute.Component<'contact.phone'>;
    mainAddress: Attribute.Component<'address.address'>;
    isArchived: Attribute.Boolean;
    group: Attribute.Relation<
      'api::customer.customer',
      'manyToOne',
      'api::contact-group.contact-group'
    >;
    source: Attribute.Relation<
      'api::customer.customer',
      'manyToOne',
      'api::contact-source.contact-source'
    >;
    tags: Attribute.Relation<
      'api::customer.customer',
      'oneToMany',
      'api::tag.tag'
    >;
    responsible: Attribute.Relation<
      'api::customer.customer',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    company: Attribute.Relation<
      'api::customer.customer',
      'oneToOne',
      'api::company.company'
    >;
    rating: Attribute.Integer;
    value: Attribute.Decimal;
    cellphone: Attribute.Component<'contact.phone'>;
    finalName: Attribute.String;
    leadMeta: Attribute.Component<'lead.lead-meta'>;
    tasks: Attribute.Relation<
      'api::customer.customer',
      'oneToMany',
      'api::task.task'
    >;
    notes: Attribute.Relation<
      'api::customer.customer',
      'oneToMany',
      'api::note.note'
    >;
    insiders: Attribute.Relation<
      'api::customer.customer',
      'oneToMany',
      'api::insider.insider'
    >;
    fiscalInfo: Attribute.Component<'fiscal.fiscal-info'>;
    customerMeta: Attribute.Component<'customer.customer-meta'>;
    documents: Attribute.Relation<
      'api::customer.customer',
      'oneToMany',
      'api::document.document'
    >;
    interactions: Attribute.Relation<
      'api::customer.customer',
      'oneToMany',
      'api::contact-interaction.contact-interaction'
    >;
    priceList: Attribute.Relation<
      'api::customer.customer',
      'manyToOne',
      'api::price-list.price-list'
    >;
    deliveryAddresses: Attribute.Component<'address.delivery-addresses', true>;
    estimates: Attribute.Relation<
      'api::customer.customer',
      'oneToMany',
      'api::estimate.estimate'
    >;
    sales: Attribute.Relation<
      'api::customer.customer',
      'oneToMany',
      'api::sale.sale'
    >;
    credit: Attribute.Component<'customer.credit'>;
    website: Attribute.String;
    creditHistory: Attribute.Relation<
      'api::customer.customer',
      'oneToMany',
      'api::customer-credit.customer-credit'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::customer.customer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::customer.customer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCustomerCreditCustomerCredit extends Schema.CollectionType {
  collectionName: 'customers_credit';
  info: {
    singularName: 'customer-credit';
    pluralName: 'customers-credit';
    displayName: 'Customer Credit';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    customer: Attribute.Relation<
      'api::customer-credit.customer-credit',
      'manyToOne',
      'api::customer.customer'
    >;
    details: Attribute.Component<'customer.credit'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::customer-credit.customer-credit',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::customer-credit.customer-credit',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiDocumentDocument extends Schema.CollectionType {
  collectionName: 'documents';
  info: {
    singularName: 'document';
    pluralName: 'documents';
    displayName: 'Document';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    user: Attribute.Relation<
      'api::document.document',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    file: Attribute.Media;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::document.document',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::document.document',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiEstimateEstimate extends Schema.CollectionType {
  collectionName: 'estimates';
  info: {
    singularName: 'estimate';
    pluralName: 'estimates';
    displayName: 'Estimate';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    fol: Attribute.Integer;
    responsible: Attribute.Relation<
      'api::estimate.estimate',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    closingDate: Attribute.Date;
    stage: Attribute.Relation<
      'api::estimate.estimate',
      'manyToOne',
      'api::estimate-stage.estimate-stage'
    >;
    customer: Attribute.Relation<
      'api::estimate.estimate',
      'manyToOne',
      'api::customer.customer'
    >;
    lead: Attribute.Relation<
      'api::estimate.estimate',
      'manyToOne',
      'api::lead.lead'
    >;
    deliveryAddress: Attribute.Component<'address.delivery-addresses'>;
    versions: Attribute.Component<'estimate.version', true>;
    company: Attribute.Relation<
      'api::estimate.estimate',
      'oneToOne',
      'api::company.company'
    >;
    saleMeta: Attribute.Component<'estimate.sales-meta'>;
    sale: Attribute.Relation<
      'api::estimate.estimate',
      'oneToOne',
      'api::sale.sale'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::estimate.estimate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::estimate.estimate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiEstimateStageEstimateStage extends Schema.CollectionType {
  collectionName: 'estimate_stages';
  info: {
    singularName: 'estimate-stage';
    pluralName: 'estimate-stages';
    displayName: 'Estimate Stage';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    name: Attribute.String;
    potential: Attribute.Integer;
    estimates: Attribute.Relation<
      'api::estimate-stage.estimate-stage',
      'oneToMany',
      'api::estimate.estimate'
    >;
    company: Attribute.Relation<
      'api::estimate-stage.estimate-stage',
      'oneToOne',
      'api::company.company'
    >;
    isDefault: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::estimate-stage.estimate-stage',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::estimate-stage.estimate-stage',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiInsiderInsider extends Schema.CollectionType {
  collectionName: 'insiders';
  info: {
    singularName: 'insider';
    pluralName: 'insiders';
    displayName: 'Insider';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    completeName: Attribute.Component<'contact.complete-name'>;
    email: Attribute.String;
    phone: Attribute.Component<'contact.phone'>;
    isPrimary: Attribute.Boolean;
    lead: Attribute.Relation<
      'api::insider.insider',
      'manyToOne',
      'api::lead.lead'
    >;
    company: Attribute.Relation<
      'api::insider.insider',
      'oneToOne',
      'api::company.company'
    >;
    job: Attribute.String;
    customer: Attribute.Relation<
      'api::insider.insider',
      'manyToOne',
      'api::customer.customer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::insider.insider',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::insider.insider',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiInvitationInvitation extends Schema.CollectionType {
  collectionName: 'invitations';
  info: {
    singularName: 'invitation';
    pluralName: 'invitations';
    displayName: 'Invitation';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    name: Attribute.String & Attribute.Required;
    lastName: Attribute.String;
    email: Attribute.String & Attribute.Required;
    role: Attribute.String & Attribute.Required;
    invitedBy: Attribute.Relation<
      'api::invitation.invitation',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    company: Attribute.Relation<
      'api::invitation.invitation',
      'oneToOne',
      'api::company.company'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::invitation.invitation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::invitation.invitation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiLeadLead extends Schema.CollectionType {
  collectionName: 'leads';
  info: {
    singularName: 'lead';
    pluralName: 'leads';
    displayName: 'Lead';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    completeName: Attribute.Component<'contact.complete-name'>;
    tradeName: Attribute.String;
    email: Attribute.String;
    phone: Attribute.Component<'contact.phone'>;
    mainAddress: Attribute.Component<'address.address'>;
    rating: Attribute.Integer & Attribute.DefaultTo<0>;
    isActive: Attribute.Boolean & Attribute.DefaultTo<true>;
    group: Attribute.Relation<
      'api::lead.lead',
      'manyToOne',
      'api::contact-group.contact-group'
    >;
    source: Attribute.Relation<
      'api::lead.lead',
      'manyToOne',
      'api::contact-source.contact-source'
    >;
    tags: Attribute.Relation<'api::lead.lead', 'oneToMany', 'api::tag.tag'>;
    responsible: Attribute.Relation<
      'api::lead.lead',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    company: Attribute.Relation<
      'api::lead.lead',
      'oneToOne',
      'api::company.company'
    >;
    value: Attribute.Decimal;
    potential: Attribute.Integer;
    cellphone: Attribute.Component<'contact.phone'>;
    finalName: Attribute.String;
    documents: Attribute.Relation<
      'api::lead.lead',
      'oneToMany',
      'api::document.document'
    >;
    tasks: Attribute.Relation<'api::lead.lead', 'oneToMany', 'api::task.task'>;
    notes: Attribute.Relation<'api::lead.lead', 'oneToMany', 'api::note.note'>;
    interactions: Attribute.Relation<
      'api::lead.lead',
      'oneToMany',
      'api::contact-interaction.contact-interaction'
    >;
    insiders: Attribute.Relation<
      'api::lead.lead',
      'oneToMany',
      'api::insider.insider'
    >;
    website: Attribute.String;
    deliveryAddresses: Attribute.Component<'address.delivery-addresses', true>;
    estimates: Attribute.Relation<
      'api::lead.lead',
      'oneToMany',
      'api::estimate.estimate'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::lead.lead', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::lead.lead', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiNoteNote extends Schema.CollectionType {
  collectionName: 'notes';
  info: {
    singularName: 'note';
    pluralName: 'notes';
    displayName: 'Note';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    title: Attribute.String;
    content: Attribute.String;
    author: Attribute.Relation<
      'api::note.note',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    lead: Attribute.Relation<'api::note.note', 'manyToOne', 'api::lead.lead'>;
    company: Attribute.Relation<
      'api::note.note',
      'oneToOne',
      'api::company.company'
    >;
    customer: Attribute.Relation<
      'api::note.note',
      'manyToOne',
      'api::customer.customer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::note.note', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::note.note', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiPackagePackage extends Schema.CollectionType {
  collectionName: 'packages';
  info: {
    singularName: 'package';
    pluralName: 'packages';
    displayName: 'Package';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    unity: Attribute.Relation<
      'api::package.package',
      'oneToOne',
      'api::unity.unity'
    >;
    conversionRate: Attribute.Float;
    product: Attribute.Relation<
      'api::package.package',
      'manyToOne',
      'api::product.product'
    >;
    referenceUnity: Attribute.Relation<
      'api::package.package',
      'oneToOne',
      'api::package.package'
    >;
    realConversion: Attribute.Float;
    variation: Attribute.Relation<
      'api::package.package',
      'manyToOne',
      'api::product-variation.product-variation'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::package.package',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::package.package',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPaymentPayment extends Schema.CollectionType {
  collectionName: 'payments';
  info: {
    singularName: 'payment';
    pluralName: 'payments';
    displayName: 'Payment';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    amount: Attribute.Decimal;
    date: Attribute.Date;
    fol: Attribute.Integer;
    paymentMethod: Attribute.String;
    comments: Attribute.String;
    sale: Attribute.Relation<
      'api::payment.payment',
      'manyToOne',
      'api::sale.sale'
    >;
    status: Attribute.String;
    files: Attribute.Media;
    daysDifference: Attribute.Integer;
    creditMovement: Attribute.Relation<
      'api::payment.payment',
      'oneToOne',
      'api::credit-movement.credit-movement'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::payment.payment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::payment.payment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPreferencePreference extends Schema.CollectionType {
  collectionName: 'preferences';
  info: {
    singularName: 'preference';
    pluralName: 'preferences';
    displayName: 'Preference';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    app: Attribute.String;
    module: Attribute.String;
    config: Attribute.JSON;
    company: Attribute.Relation<
      'api::preference.preference',
      'oneToOne',
      'api::company.company'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::preference.preference',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::preference.preference',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPriceListPriceList extends Schema.CollectionType {
  collectionName: 'price_lists';
  info: {
    singularName: 'price-list';
    pluralName: 'price-lists';
    displayName: 'Price List';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    name: Attribute.String;
    company: Attribute.Relation<
      'api::price-list.price-list',
      'oneToOne',
      'api::company.company'
    >;
    customers: Attribute.Relation<
      'api::price-list.price-list',
      'oneToMany',
      'api::customer.customer'
    >;
    discount: Attribute.Decimal;
    isDefault: Attribute.Boolean;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::price-list.price-list',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::price-list.price-list',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProductProduct extends Schema.CollectionType {
  collectionName: 'products';
  info: {
    singularName: 'product';
    pluralName: 'products';
    displayName: 'Product';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    images: Attribute.Media;
    type: Attribute.String;
    name: Attribute.String;
    description: Attribute.Text;
    sku: Attribute.String;
    dimensions: Attribute.Component<'product.dimensions'>;
    url: Attribute.String;
    satCode: Attribute.String;
    taxType: Attribute.String;
    saleInfo: Attribute.Component<'product.sale-information'>;
    purchaseInfo: Attribute.Component<'product.purchase-info'>;
    stockInfo: Attribute.Component<'product.stock-info'>;
    isDraft: Attribute.Boolean;
    category: Attribute.Relation<
      'api::product.product',
      'manyToOne',
      'api::product-category.product-category'
    >;
    company: Attribute.Relation<
      'api::product.product',
      'oneToOne',
      'api::company.company'
    >;
    tags: Attribute.Relation<
      'api::product.product',
      'oneToMany',
      'api::tag.tag'
    >;
    attributes: Attribute.Component<'product.product-attributes', true>;
    variations: Attribute.Relation<
      'api::product.product',
      'oneToMany',
      'api::product-variation.product-variation'
    >;
    packages: Attribute.Relation<
      'api::product.product',
      'oneToMany',
      'api::package.package'
    >;
    unity: Attribute.Relation<
      'api::product.product',
      'manyToOne',
      'api::unity.unity'
    >;
    stocks: Attribute.Relation<
      'api::product.product',
      'oneToMany',
      'api::stock.stock'
    >;
    badges: Attribute.Relation<
      'api::product.product',
      'oneToMany',
      'api::product-badge.product-badge'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::product.product',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::product.product',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProductAttributeProductAttribute
  extends Schema.CollectionType {
  collectionName: 'product_attributes';
  info: {
    singularName: 'product-attribute';
    pluralName: 'product-attributes';
    displayName: 'Product Attribute';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    name: Attribute.String;
    values: Attribute.Relation<
      'api::product-attribute.product-attribute',
      'oneToMany',
      'api::attribute-value.attribute-value'
    >;
    company: Attribute.Relation<
      'api::product-attribute.product-attribute',
      'oneToOne',
      'api::company.company'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::product-attribute.product-attribute',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::product-attribute.product-attribute',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProductBadgeProductBadge extends Schema.CollectionType {
  collectionName: 'product_badges';
  info: {
    singularName: 'product-badge';
    pluralName: 'product-badges';
    displayName: 'Product Badge';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    name: Attribute.String;
    expirationDate: Attribute.Date;
    product: Attribute.Relation<
      'api::product-badge.product-badge',
      'manyToOne',
      'api::product.product'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::product-badge.product-badge',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::product-badge.product-badge',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProductCategoryProductCategory
  extends Schema.CollectionType {
  collectionName: 'product_categories';
  info: {
    singularName: 'product-category';
    pluralName: 'product-categories';
    displayName: 'Product Category';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    color: Attribute.String;
    icon: Attribute.String;
    name: Attribute.String;
    products: Attribute.Relation<
      'api::product-category.product-category',
      'oneToMany',
      'api::product.product'
    >;
    company: Attribute.Relation<
      'api::product-category.product-category',
      'oneToOne',
      'api::company.company'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::product-category.product-category',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::product-category.product-category',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProductVariationProductVariation
  extends Schema.CollectionType {
  collectionName: 'product_variations';
  info: {
    singularName: 'product-variation';
    pluralName: 'product-variations';
    displayName: 'Product Variation';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    sku: Attribute.String;
    description: Attribute.Text;
    dimensions: Attribute.Component<'product.dimensions'>;
    values: Attribute.Relation<
      'api::product-variation.product-variation',
      'manyToMany',
      'api::attribute-value.attribute-value'
    >;
    name: Attribute.String;
    product: Attribute.Relation<
      'api::product-variation.product-variation',
      'manyToOne',
      'api::product.product'
    >;
    image: Attribute.Media;
    saleInfo: Attribute.Component<'product.sale-information'>;
    purchaseInfo: Attribute.Component<'product.purchase-info'>;
    stockInfo: Attribute.Component<'product.stock-info'>;
    packages: Attribute.Relation<
      'api::product-variation.product-variation',
      'oneToMany',
      'api::package.package'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::product-variation.product-variation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::product-variation.product-variation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSaleSale extends Schema.CollectionType {
  collectionName: 'sales';
  info: {
    singularName: 'sale';
    pluralName: 'sales';
    displayName: 'Sale';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    fol: Attribute.Integer;
    responsible: Attribute.Relation<
      'api::sale.sale',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    deliveryDate: Attribute.Date;
    customer: Attribute.Relation<
      'api::sale.sale',
      'manyToOne',
      'api::customer.customer'
    >;
    deliveryAddress: Attribute.Component<'address.delivery-addresses'>;
    date: Attribute.Date;
    paymentScheme: Attribute.String;
    priceList: Attribute.Relation<
      'api::sale.sale',
      'oneToOne',
      'api::price-list.price-list'
    >;
    subject: Attribute.String;
    items: Attribute.Component<'estimate.estimate-item', true>;
    resume: Attribute.Component<'estimate.resume'>;
    comments: Attribute.Text;
    terms: Attribute.Text;
    company: Attribute.Relation<
      'api::sale.sale',
      'oneToOne',
      'api::company.company'
    >;
    isAuthorized: Attribute.Boolean;
    deliveryTime: Attribute.Integer;
    estimate: Attribute.Relation<
      'api::sale.sale',
      'oneToOne',
      'api::estimate.estimate'
    >;
    authorizedAt: Attribute.DateTime;
    creditMovement: Attribute.Relation<
      'api::sale.sale',
      'oneToOne',
      'api::credit-movement.credit-movement'
    >;
    payments: Attribute.Relation<
      'api::sale.sale',
      'oneToMany',
      'api::payment.payment'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::sale.sale', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::sale.sale', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiStockStock extends Schema.CollectionType {
  collectionName: 'stocks';
  info: {
    singularName: 'stock';
    pluralName: 'stocks';
    displayName: 'Stock';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    product: Attribute.Relation<
      'api::stock.stock',
      'manyToOne',
      'api::product.product'
    >;
    location: Attribute.Relation<
      'api::stock.stock',
      'manyToOne',
      'api::stock-location.stock-location'
    >;
    quantity: Attribute.Float;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::stock.stock',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::stock.stock',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiStockLocationStockLocation extends Schema.CollectionType {
  collectionName: 'stock_locations';
  info: {
    singularName: 'stock-location';
    pluralName: 'stock-locations';
    displayName: 'Stock Location';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    name: Attribute.String;
    identifier: Attribute.String;
    allowDeliveries: Attribute.Boolean;
    allowDispatches: Attribute.Boolean;
    warehouse: Attribute.Relation<
      'api::stock-location.stock-location',
      'manyToOne',
      'api::warehouse.warehouse'
    >;
    stocks: Attribute.Relation<
      'api::stock-location.stock-location',
      'oneToMany',
      'api::stock.stock'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::stock-location.stock-location',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::stock-location.stock-location',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiStockMovementStockMovement extends Schema.CollectionType {
  collectionName: 'stock_movements';
  info: {
    singularName: 'stock-movement';
    pluralName: 'stock-movements';
    displayName: 'Stock Movement';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    quantity: Attribute.Float;
    type: Attribute.String;
    comments: Attribute.String;
    product: Attribute.Relation<
      'api::stock-movement.stock-movement',
      'oneToOne',
      'api::product.product'
    >;
    motive: Attribute.Relation<
      'api::stock-movement.stock-movement',
      'oneToOne',
      'api::adjustment-motive.adjustment-motive'
    >;
    location: Attribute.Relation<
      'api::stock-movement.stock-movement',
      'oneToOne',
      'api::stock-location.stock-location'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::stock-movement.stock-movement',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::stock-movement.stock-movement',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSuscriptionPaymentSuscriptionPayment
  extends Schema.CollectionType {
  collectionName: 'suscription_payments';
  info: {
    singularName: 'suscription-payment';
    pluralName: 'suscription-payments';
    displayName: 'Suscription Payment';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    company: Attribute.Relation<
      'api::suscription-payment.suscription-payment',
      'manyToOne',
      'api::company.company'
    >;
    plan: Attribute.Relation<
      'api::suscription-payment.suscription-payment',
      'manyToOne',
      'api::suscription-plan.suscription-plan'
    >;
    amount: Attribute.Decimal & Attribute.Required;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::suscription-payment.suscription-payment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::suscription-payment.suscription-payment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSuscriptionPlanSuscriptionPlan
  extends Schema.CollectionType {
  collectionName: 'suscription_plans';
  info: {
    singularName: 'suscription-plan';
    pluralName: 'suscription-plans';
    displayName: 'Suscription Plan';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    name: Attribute.String & Attribute.Required & Attribute.Unique;
    price: Attribute.Decimal &
      Attribute.Required &
      Attribute.Unique &
      Attribute.DefaultTo<0>;
    companies: Attribute.Relation<
      'api::suscription-plan.suscription-plan',
      'oneToMany',
      'api::company.company'
    >;
    payments: Attribute.Relation<
      'api::suscription-plan.suscription-plan',
      'oneToMany',
      'api::suscription-payment.suscription-payment'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::suscription-plan.suscription-plan',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::suscription-plan.suscription-plan',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSuscriptionStatusSuscriptionStatus
  extends Schema.CollectionType {
  collectionName: 'suscription_statuses';
  info: {
    singularName: 'suscription-status';
    pluralName: 'suscription-statuses';
    displayName: 'Suscription Status';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    company: Attribute.Relation<
      'api::suscription-status.suscription-status',
      'oneToOne',
      'api::company.company'
    >;
    nextBilling: Attribute.Date & Attribute.Required;
    amount: Attribute.Decimal & Attribute.Required;
    plan: Attribute.Relation<
      'api::suscription-status.suscription-status',
      'oneToOne',
      'api::suscription-plan.suscription-plan'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::suscription-status.suscription-status',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::suscription-status.suscription-status',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiTagTag extends Schema.CollectionType {
  collectionName: 'tags';
  info: {
    singularName: 'tag';
    pluralName: 'tags';
    displayName: 'Tag';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    name: Attribute.String;
    entity: Attribute.String;
    company: Attribute.Relation<
      'api::tag.tag',
      'oneToOne',
      'api::company.company'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::tag.tag', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::tag.tag', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiTaskTask extends Schema.CollectionType {
  collectionName: 'tasks';
  info: {
    singularName: 'task';
    pluralName: 'tasks';
    displayName: 'Task';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    title: Attribute.String;
    description: Attribute.String;
    dueDate: Attribute.DateTime;
    reminders: Attribute.JSON;
    responsible: Attribute.Relation<
      'api::task.task',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    lead: Attribute.Relation<'api::task.task', 'manyToOne', 'api::lead.lead'>;
    company: Attribute.Relation<
      'api::task.task',
      'oneToOne',
      'api::company.company'
    >;
    isCompleted: Attribute.Boolean & Attribute.DefaultTo<false>;
    completedAt: Attribute.DateTime;
    customer: Attribute.Relation<
      'api::task.task',
      'manyToOne',
      'api::customer.customer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::task.task', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::task.task', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiUnityUnity extends Schema.CollectionType {
  collectionName: 'unities';
  info: {
    singularName: 'unity';
    pluralName: 'unities';
    displayName: 'Unity';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    name: Attribute.String;
    satCode: Attribute.String;
    company: Attribute.Relation<
      'api::unity.unity',
      'oneToOne',
      'api::company.company'
    >;
    abbreviation: Attribute.String;
    products: Attribute.Relation<
      'api::unity.unity',
      'oneToMany',
      'api::product.product'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::unity.unity',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::unity.unity',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiUserSessionUserSession extends Schema.CollectionType {
  collectionName: 'user_sessions';
  info: {
    singularName: 'user-session';
    pluralName: 'user-sessions';
    displayName: 'User Session';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String & Attribute.Unique;
    system: Attribute.String;
    user: Attribute.Relation<
      'api::user-session.user-session',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    ip: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::user-session.user-session',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::user-session.user-session',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiWarehouseWarehouse extends Schema.CollectionType {
  collectionName: 'warehouses';
  info: {
    singularName: 'warehouse';
    pluralName: 'warehouses';
    displayName: 'Warehouse';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    uuid: Attribute.String;
    name: Attribute.String;
    address: Attribute.Component<'address.address'>;
    isActive: Attribute.Boolean;
    company: Attribute.Relation<
      'api::warehouse.warehouse',
      'oneToOne',
      'api::company.company'
    >;
    layout: Attribute.JSON;
    locations: Attribute.Relation<
      'api::warehouse.warehouse',
      'oneToMany',
      'api::stock-location.stock-location'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::warehouse.warehouse',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::warehouse.warehouse',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'api::adjustment-motive.adjustment-motive': ApiAdjustmentMotiveAdjustmentMotive;
      'api::attribute-value.attribute-value': ApiAttributeValueAttributeValue;
      'api::company.company': ApiCompanyCompany;
      'api::company-niche.company-niche': ApiCompanyNicheCompanyNiche;
      'api::contact-group.contact-group': ApiContactGroupContactGroup;
      'api::contact-interaction.contact-interaction': ApiContactInteractionContactInteraction;
      'api::contact-source.contact-source': ApiContactSourceContactSource;
      'api::credit-movement.credit-movement': ApiCreditMovementCreditMovement;
      'api::customer.customer': ApiCustomerCustomer;
      'api::customer-credit.customer-credit': ApiCustomerCreditCustomerCredit;
      'api::document.document': ApiDocumentDocument;
      'api::estimate.estimate': ApiEstimateEstimate;
      'api::estimate-stage.estimate-stage': ApiEstimateStageEstimateStage;
      'api::insider.insider': ApiInsiderInsider;
      'api::invitation.invitation': ApiInvitationInvitation;
      'api::lead.lead': ApiLeadLead;
      'api::note.note': ApiNoteNote;
      'api::package.package': ApiPackagePackage;
      'api::payment.payment': ApiPaymentPayment;
      'api::preference.preference': ApiPreferencePreference;
      'api::price-list.price-list': ApiPriceListPriceList;
      'api::product.product': ApiProductProduct;
      'api::product-attribute.product-attribute': ApiProductAttributeProductAttribute;
      'api::product-badge.product-badge': ApiProductBadgeProductBadge;
      'api::product-category.product-category': ApiProductCategoryProductCategory;
      'api::product-variation.product-variation': ApiProductVariationProductVariation;
      'api::sale.sale': ApiSaleSale;
      'api::stock.stock': ApiStockStock;
      'api::stock-location.stock-location': ApiStockLocationStockLocation;
      'api::stock-movement.stock-movement': ApiStockMovementStockMovement;
      'api::suscription-payment.suscription-payment': ApiSuscriptionPaymentSuscriptionPayment;
      'api::suscription-plan.suscription-plan': ApiSuscriptionPlanSuscriptionPlan;
      'api::suscription-status.suscription-status': ApiSuscriptionStatusSuscriptionStatus;
      'api::tag.tag': ApiTagTag;
      'api::task.task': ApiTaskTask;
      'api::unity.unity': ApiUnityUnity;
      'api::user-session.user-session': ApiUserSessionUserSession;
      'api::warehouse.warehouse': ApiWarehouseWarehouse;
    }
  }
}
