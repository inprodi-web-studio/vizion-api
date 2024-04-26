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

export interface CustomerCustomerMeta extends Schema.Component {
  collectionName: 'components_customer_customer_metas';
  info: {
    displayName: 'Customer Meta';
  };
  attributes: {
    lastSale: Attribute.DateTime;
    totalSales: Attribute.Decimal;
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

export interface LeadLeadMeta extends Schema.Component {
  collectionName: 'components_lead_lead_metas';
  info: {
    displayName: 'leadMeta';
    description: '';
  };
  attributes: {
    daysToConvert: Attribute.Integer;
    convertedAt: Attribute.DateTime;
    leadCreatedAt: Attribute.DateTime;
  };
}

export interface ProductDimensions extends Schema.Component {
  collectionName: 'components_product_dimensions';
  info: {
    displayName: 'Dimensions';
  };
  attributes: {
    weight: Attribute.Float;
    long: Attribute.Float;
    width: Attribute.Float;
    height: Attribute.Float;
  };
}

export interface ProductPurchaseInfo extends Schema.Component {
  collectionName: 'components_product_purchase_infos';
  info: {
    displayName: 'Purchase Info';
    description: '';
  };
  attributes: {
    price: Attribute.Decimal;
    iva: Attribute.String;
    note: Attribute.String;
    unity: Attribute.String;
  };
}

export interface ProductSaleInformation extends Schema.Component {
  collectionName: 'components_product_sale_informations';
  info: {
    displayName: 'Sale Information';
    description: '';
  };
  attributes: {
    price: Attribute.Decimal;
    iva: Attribute.String;
    deliveryTime: Attribute.Integer;
    note: Attribute.String;
    unity: Attribute.String;
  };
}

export interface ProductStockInfo extends Schema.Component {
  collectionName: 'components_product_stock_infos';
  info: {
    displayName: 'Stock Info';
    description: '';
  };
  attributes: {
    lowAlert: Attribute.Float;
    alertTo: Attribute.Relation<
      'product.stock-info',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    minQuantity: Attribute.Float;
    maxQuantity: Attribute.Float;
    noStockPolicy: Attribute.String;
    hasBatches: Attribute.Boolean;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'address.address': AddressAddress;
      'contact.complete-name': ContactCompleteName;
      'contact.phone': ContactPhone;
      'customer.customer-meta': CustomerCustomerMeta;
      'fiscal.fiscal-info': FiscalFiscalInfo;
      'lead.lead-meta': LeadLeadMeta;
      'product.dimensions': ProductDimensions;
      'product.purchase-info': ProductPurchaseInfo;
      'product.sale-information': ProductSaleInformation;
      'product.stock-info': ProductStockInfo;
    }
  }
}
