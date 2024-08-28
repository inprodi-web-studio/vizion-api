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

export interface AddressDeliveryAddresses extends Schema.Component {
  collectionName: 'components_address_delivery_addresses';
  info: {
    displayName: 'deliveryAddresses';
    description: '';
  };
  attributes: {
    address: Attribute.Component<'address.address'>;
    name: Attribute.String;
    references: Attribute.Text;
    isMain: Attribute.Boolean;
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

export interface CustomerCredit extends Schema.Component {
  collectionName: 'components_customer_credits';
  info: {
    displayName: 'credit';
    description: '';
  };
  attributes: {
    daysToPay: Attribute.Integer;
    amountLimit: Attribute.Decimal;
    amountUsed: Attribute.Decimal;
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

export interface EstimateDiscount extends Schema.Component {
  collectionName: 'components_estimate_discounts';
  info: {
    displayName: 'Discount';
  };
  attributes: {
    percent: Attribute.Decimal;
    amount: Attribute.Decimal;
  };
}

export interface EstimateEstimateItem extends Schema.Component {
  collectionName: 'components_estimate_estimate_items';
  info: {
    displayName: 'Estimate Item';
    description: '';
  };
  attributes: {
    product: Attribute.Relation<
      'estimate.estimate-item',
      'oneToOne',
      'api::product.product'
    >;
    quantity: Attribute.Decimal;
    price: Attribute.Decimal;
    iva: Attribute.String;
    discount: Attribute.Component<'estimate.discount'>;
  };
}

export interface EstimateResume extends Schema.Component {
  collectionName: 'components_estimate_resumes';
  info: {
    displayName: 'resume';
  };
  attributes: {
    subtotal: Attribute.Decimal;
    individualDiscounts: Attribute.Decimal;
    globalDiscount: Attribute.Component<'estimate.discount'>;
    taxes: Attribute.Decimal;
    shipping: Attribute.Decimal;
    total: Attribute.Decimal;
  };
}

export interface EstimateSalesMeta extends Schema.Component {
  collectionName: 'components_estimate_sales_metas';
  info: {
    displayName: 'Sales Meta';
    description: '';
  };
  attributes: {
    closingDate: Attribute.Date;
    daysToClose: Attribute.Integer;
    closedVersion: Attribute.Integer;
    closedTotal: Attribute.Decimal;
  };
}

export interface EstimateVersion extends Schema.Component {
  collectionName: 'components_estimate_versions';
  info: {
    displayName: 'Version';
  };
  attributes: {
    fol: Attribute.Integer;
    date: Attribute.Date;
    dueDate: Attribute.Date;
    deliveryTime: Attribute.Integer;
    paymentScheme: Attribute.String;
    priceList: Attribute.Relation<
      'estimate.version',
      'oneToOne',
      'api::price-list.price-list'
    >;
    subject: Attribute.String;
    items: Attribute.Component<'estimate.estimate-item', true>;
    resume: Attribute.Component<'estimate.resume'>;
    comments: Attribute.Text;
    terms: Attribute.Text;
    isActive: Attribute.Boolean;
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

export interface ProductPriceConfig extends Schema.Component {
  collectionName: 'components_product_price_configs';
  info: {
    displayName: 'Price Config';
  };
  attributes: {
    type: Attribute.String;
    config: Attribute.JSON;
  };
}

export interface ProductProductAttributes extends Schema.Component {
  collectionName: 'components_product_product_attributes';
  info: {
    displayName: 'Product Attributes';
  };
  attributes: {
    attribute: Attribute.Relation<
      'product.product-attributes',
      'oneToOne',
      'api::product-attribute.product-attribute'
    >;
    values: Attribute.Relation<
      'product.product-attributes',
      'oneToMany',
      'api::attribute-value.attribute-value'
    >;
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
    note: Attribute.Text;
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
    note: Attribute.Text;
    unity: Attribute.String;
    priceConfig: Attribute.Component<'product.price-config'>;
    upsells: Attribute.Relation<
      'product.sale-information',
      'oneToMany',
      'api::product.product'
    >;
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
    isPerishable: Attribute.Boolean;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'address.address': AddressAddress;
      'address.delivery-addresses': AddressDeliveryAddresses;
      'contact.complete-name': ContactCompleteName;
      'contact.phone': ContactPhone;
      'customer.credit': CustomerCredit;
      'customer.customer-meta': CustomerCustomerMeta;
      'estimate.discount': EstimateDiscount;
      'estimate.estimate-item': EstimateEstimateItem;
      'estimate.resume': EstimateResume;
      'estimate.sales-meta': EstimateSalesMeta;
      'estimate.version': EstimateVersion;
      'fiscal.fiscal-info': FiscalFiscalInfo;
      'lead.lead-meta': LeadLeadMeta;
      'product.dimensions': ProductDimensions;
      'product.price-config': ProductPriceConfig;
      'product.product-attributes': ProductProductAttributes;
      'product.purchase-info': ProductPurchaseInfo;
      'product.sale-information': ProductSaleInformation;
      'product.stock-info': ProductStockInfo;
    }
  }
}
