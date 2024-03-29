import type { Schema, Attribute } from '@strapi/strapi';

export interface AddressAddress extends Schema.Component {
  collectionName: 'components_address_addresses';
  info: {
    displayName: 'Address';
  };
  attributes: {
    street: Attribute.String;
    extNumber: Attribute.String;
    intNumber: Attribute.String;
    suburb: Attribute.String;
    cp: Attribute.String;
    city: Attribute.String;
    state: Attribute.String;
    country: Attribute.String;
  };
}

export interface ContactCompleteName extends Schema.Component {
  collectionName: 'components_contact_complete_names';
  info: {
    displayName: 'Complete Name';
  };
  attributes: {
    name: Attribute.String;
    middleName: Attribute.String;
    lastName: Attribute.String;
  };
}

export interface ContactPhone extends Schema.Component {
  collectionName: 'components_contact_phones';
  info: {
    displayName: 'Phone';
  };
  attributes: {
    code: Attribute.String;
    number: Attribute.String;
  };
}

export interface FiscalFiscalInfo extends Schema.Component {
  collectionName: 'components_fiscal_fiscal_infos';
  info: {
    displayName: 'Fiscal Info';
  };
  attributes: {
    legalName: Attribute.String;
    rfc: Attribute.String;
    regime: Attribute.String;
    address: Attribute.Component<'address.address'>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'address.address': AddressAddress;
      'contact.complete-name': ContactCompleteName;
      'contact.phone': ContactPhone;
      'fiscal.fiscal-info': FiscalFiscalInfo;
    }
  }
}
