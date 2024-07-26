const defaultPreferences = {
    crm : {
        estimates : {
            "showRFC": true,
            "autoInvoice": true,
            "showAddress": true,
            "showLogotype": true,
            "addressToShow": "fiscal",
            "showLegalName": true,
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