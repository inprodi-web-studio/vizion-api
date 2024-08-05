const defaultPreferences = {
    crm : {
        estimates : {
            "showLogotype": true,
            "showRFC": true,
            "showLegalName": true,
            "showAddress": true,
            "addressToShow": "fiscal",
            "autoInvoice": true,
            "showContactRFC" : true,
            "showContactLegalName" : true,
            "showContactAddress" : true,
            "contactAddressToShow" : "fiscal",
            "defaultDueDays": 30,
            "defaultCloseDays": 20,
            "defaultDeliveryDays" : 10,
            "allowModifyTaxes": true,
            "allowModifyPrices": true,
            "allowChangeDueDate": true,
            "allowItemDiscounts": true,
            "allowGlobalDiscounts": true,
            "allowModifyPriceList": true,
            "defaultCustomerNote": "",
            "defaultTermsAndConditions": "",
            "showWebsite": true,
          }
    },
};

module.exports = defaultPreferences;