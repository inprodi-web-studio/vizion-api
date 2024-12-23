const dayjs = require("dayjs");

const defaultPayment = (data, preferences, companyInfo) => {
    const {
        addressToShow,
        showLegalName,
        showRFC,
        showAddress,
        showWebsite,
        showLogotype,
        contactAddressToShow,
        showContactLegalName,
        showContactRFC,
        showContactAddress,
    } = preferences;

    const methodDictionary = {
        cash : "Efectivo",
        transfer : "Transferencia Electrónica",
        debit : "Tarjeta de Débito",
        credit : "Tarjeta de Crédito",
        check : "Cheque"
    };

    const date = dayjs(data.date).locale("es-mx").format("DD MMMM, YYYY");

    let street, extNumber, intNumber, suburb, cp, city, state, country;

    if ( addressToShow === "fiscal" && companyInfo.fiscalInfo?.address ) {
        street    = companyInfo.fiscalInfo.address.street;
        extNumber = companyInfo.fiscalInfo.address.extNumber;
        intNumber = companyInfo.fiscalInfo.address.intNumber;
        suburb    = companyInfo.fiscalInfo.address.suburb;
        cp        = companyInfo.fiscalInfo.address.cp;
        city      = companyInfo.fiscalInfo.address.city;
        state     = companyInfo.fiscalInfo.address.state;
        country   = companyInfo.fiscalInfo.address.country;
    }

    if ( addressToShow === "address" && companyInfo.address ) {
        street    = companyInfo.address.street;
        extNumber = companyInfo.address.extNumber;
        intNumber = companyInfo.address.intNumber;
        suburb    = companyInfo.address.suburb;
        cp        = companyInfo.address.cp;
        city      = companyInfo.address.city;
        state     = companyInfo.address.state;
        country   = companyInfo.address.country;
    }

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>PDF</title>

                <style>
                    @font-face {
                        font-family: 'Geist Sans';
                        font-style: normal;
                        font-display: swap;
                        font-weight: 300;
                        src: url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-300-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-300-normal.woff) format('woff');
                    }

                    @font-face {
                        font-family: 'Geist Sans';
                        font-style: normal;
                        font-display: swap;
                        font-weight: 400;
                        src: url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.woff) format('woff');
                    }

                    @font-face {
                        font-family: 'Geist Sans';
                        font-style: normal;
                        font-display: swap;
                        font-weight: 500;
                        src: url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-500-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-500-normal.woff) format('woff');
                    }

                    @font-face {
                        font-family: 'Geist Sans';
                        font-style: normal;
                        font-display: swap;
                        font-weight: 600;
                        src: url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-600-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-600-normal.woff) format('woff');
                    }

                    @font-face {
                        font-family: 'Geist Sans';
                        font-style: normal;
                        font-display: swap;
                        font-weight: 700;
                        src: url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.woff) format('woff');
                    }

                    body {
                        font-family: 'Geist Sans', sans-serif;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    p {
                        margin: 0;
                    }

                    hr {
                        border: none;
                        border-top: 1px dashed #d9d9d9;
                        margin:20px 0;
                    }

                    .header-container {
                        margin-bottom: 30px;
                        display: flex;
                        justify-content: space-between;
                    }

                    .header-container .left img {
                        width: 75px;
                    }

                    .label {
                        font-size: 12px;
                        color: #868E96;
                        font-weight: 400;
                        margin-bottom: 4px;
                    }

                    .main-text {
                        font-size: 14px;
                        font-weight: 500;
                        color: #000000;
                    }

                    .info-text {
                        font-size: 12px;
                        font-weight: 400;
                        color: #000000;
                        line-height: 1.5;
                    }

                    .fol-container {
                        display : flex;
                        align-items : center;
                        gap : 10px;
                    }

                    .fol {
                        font-size: 18px;
                        font-weight: 500;
                        color: #000000;
                    }

                    .label {
                        font-size: 12px;
                        color: #868E96;
                        font-weight: 400;
                        margin-bottom: 4px;
                    }

                    .main-label {
                        font-size: 14px;
                        color: #868E96;
                        font-weight: 400;
                    }

                    .amount {
                        font-size: 24px;
                        font-weight: 600;
                        color: #000000;
                        line-height: 1.5;
                    }

                    .details {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 20px;
                    }

                    .relations .item {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 14px;
                    }
                </style>
            </head>

            <body>
                <div class="main-container">
                    <div class="header-container">
                        <div class="left">
                            <img src="${companyInfo.logotype.url}" />

                            <p class="main-text" style="margin-top: 10px">${companyInfo.name}</p>
                            ${ (showLegalName && companyInfo.fiscalInfo?.legalName) ? `<p class="info-text" style="margin-top: 4px">${companyInfo.fiscalInfo?.legalName}</p>` : ""}
                            ${ (showRFC && companyInfo.fiscalInfo?.rfc) ? `<p class="info-text" style="margin-top: 4px">${companyInfo.fiscalInfo?.rfc}</p>` : ""}
                            ${ (showAddress && street) ? `<p class="info-text" style="margin-top: 4px">${`${ street } ${ extNumber }${ intNumber ? ` ${intNumber}` : "" }<br>${suburb}, ${cp}<br>${city}, ${state}<br>${country}`}</p>` : "" }
                            ${ (showWebsite && companyInfo.website) ? `<p class="info-text" style="margin-top: 8px">${ companyInfo.website }</p>` : "" }
                        </div>

                        <div class="right">
                            <div class="fol-container">
                                <p class="fol">Pago #${ String(data.fol).padStart(4, "0") }</p>
                            </div>
                        </div>
                    </div>

                    <div class="amount-container">
                        <p class="amount">$${ Number(data.amount).toLocaleString("es-MX", {
                            minimumFractionDigits : 2,
                            maximumFractionDigits : 2
                        })}</p>
                        <p class="label">Importe Pagado</p>
                    </div>

                    <div class="details">
                        <div class="meta-container">
                            <p class="info-text">${methodDictionary[data.paymentMethod]}</p>
                            <p class="label">Método de Pago</p>
                        </div>

                        <div class="meta-container">
                            <p class="info-text">${date}</p>
                            <p class="label">Fecha de Pago</p>
                        </div>
                    </div>

                    <hr>

                    <div class="relations">
                        <div class="item">
                            <p class="main-label">Cliente</p>
                            <p class="info-text">${data.sale.customer.finalName}</p>
                        </div>
                        
                        <div class="item">
                            <p class="main-label">Venta</p>
                            <p class="info-text">#${String(data.sale.fol).padStart(4, "0")} - ${ data.sale.subject }</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
};

module.exports = defaultPayment;