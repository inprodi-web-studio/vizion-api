const dayjs = require("dayjs");
const localizedFormat = require("dayjs/plugin/localizedFormat");
const formatCurrency = require("../helpers/formatCurrency");
require("dayjs/locale/es-mx");

dayjs.extend(localizedFormat);

const schemeDictionary = {
    "undefined" : "Sin Definir",
    "ancitipated" : "Pago Anticipado",
    "on-deliver" : "Pago contra Entrega",
    "on-advance" : "Anticipo y Liquidación",
    "deferred" : "Pagos Diferidos",
    "credit" : "Crédito"
};

const defaultEstimate = (data, version, preferences, companyInfo) => {
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

    const date = dayjs(version.date).locale("es-mx").format("MMMM DD, YYYY");
    const dueDate = dayjs(version.dueDate).locale("es-mx").format("MMMM DD, YYYY");

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

    let contactStreet, contactExtNumber, contactIntNumber, contactSuburb, contactCp, contactCity, contactState, contactCountry;

    if ( data.customer?.uuid ) {
        if ( contactAddressToShow === "fiscal" ) {
            contactStreet    = data.customer.fiscalInfo?.address?.street;
            contactExtNumber = data.customer.fiscalInfo?.address?.extNumber;
            contactIntNumber = data.customer.fiscalInfo?.address?.intNumber;
            contactSuburb    = data.customer.fiscalInfo?.address?.suburb;
            contactCp        = data.customer.fiscalInfo?.address?.cp;
            contactCity      = data.customer.fiscalInfo?.address?.city;
            contactState     = data.customer.fiscalInfo?.address?.state;
            contactCountry   = data.customer.fiscalInfo?.address?.country;
        } else {
            contactStreet = data.customer.mainAddress?.street;
            contactExtNumber = data.customer.mainAddress?.extNumber;
            contactIntNumber = data.customer.mainAddress?.intNumber;
            contactSuburb = data.customer.mainAddress?.suburb;
            contactCp = data.customer.mainAddress?.cp;
            contactCity = data.customer.mainAddress?.city;
            contactState = data.customer.mainAddress?.state;
            contactCountry = data.customer.mainAddress?.country;
        }
    }

    if ( data.lead?.uuid ) {
        contactStreet = data.lead.mainAddress?.street;
        contactExtNumber = data.lead.mainAddress?.extNumber;
        contactIntNumber = data.lead.mainAddress?.intNumber;
        contactSuburb = data.lead.mainAddress?.suburb;
        contactCp = data.lead.mainAddress?.cp;
        contactCity = data.lead.mainAddress?.city;
        contactState = data.lead.mainAddress?.state;
        contactCountry = data.lead.mainAddress?.country;
    }

    let deliveryStreet, deliveryExtNumber, deliveryIntNumber, deliverySuburb, deliveryCp, deliveryCity, deliveryState, deliveryCountry;

    if ( data.deliveryAddress ) {
        deliveryStreet = data.deliveryAddress.address.street;
        deliveryExtNumber = data.deliveryAddress.address.extNumber;
        deliveryIntNumber = data.deliveryAddress.address.intNumber;
        deliverySuburb = data.deliveryAddress.address.suburb;
        deliveryCp = data.deliveryAddress.address.cp;
        deliveryCity = data.deliveryAddress.address.city;
        deliveryState = data.deliveryAddress.address.state;
        deliveryCountry = data.deliveryAddress.address.country;
    }

    const individualDiscounts = version.resume.individualDiscounts ?? 0;
    const globalDiscount = version.resume.globalDiscount?.amount ?? 0;

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
                    border-top: 1px solid #d9d9d9;
                    margin:10px 0;
                }

                .header-container {
                    margin-bottom : 20px;
                    display : flex;
                    justify-content : space-between;
                }

                .header-container img {
                    height : 60px;
                }

                .fol {
                    font-size: 18px;
                    font-weight: 500;
                    color: #000000;
                }

                .fol-container {
                    display : flex;
                    align-items : center;
                    gap : 10px;
                }

                .version-badge {
                    background-color: #4096FF;
                    border-radius: 4px;
                    color: white;
                    font-size: 12px;
                    line-height: 20px;
                    padding: 0 7px;
                }

                .meta-container,
                .dates-container,
                .specs-container {
                    display : grid;
                    grid-template-columns : repeat(3, minmax(0, 1fr));
                    grid-column-gap: 20px;
                    width: 100%;
                }

                .meta-container > div,
                .dates-container > div,
                .specs-container > div {
                    width: 100%;
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

                .address-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-direction: row;
                }

                .address-container img {
                    height: 100px;
                    width: 60px;
                    border-radius: 6px;
                }

                .subject {
                    font-size: 20px;
                    font-weight: 500;
                    color: #000000;
                    margin-top: 40px;
                    margin-bottom: 20px;
                }

                .table {
                    width: 100%;
                    max-width: 100%;
                }

                .table .header {
                    display: grid;
                    grid-template-columns: repeat(12,minmax(0,1fr));
                    grid-column-gap: 20px;
                    padding: 4px 10px;
                    background-color: #f5f5f5;
                    border: solid 1px #d9d9d9;
                }

                .table .body {
                    display: grid;
                    grid-template-columns: repeat(12,minmax(0,1fr));
                    grid-column-gap: 20px;
                    padding: 12px 10px;
                    border-right: 1px solid #d9d9d9;
                    border-bottom: 1px solid #d9d9d9;
                    border-left: 1px solid #d9d9d9;
                }

                .table .header p {
                    font-size: 12px;
                    color: #868E96;
                    font-weight: 500;
                }

                .product-container {
                    display: flex;
                    flex-direction: row;
                    gap: 10px;
                    align-items: center;
                }

                .product-image {
                    width: 40px;
                    height: 40px;
                    object-fit: cover;
                    border-radius: 6px;
                    background: white;
                }

                .product-avatar {
                    width: 40px;
                    height: 40px;
                    background: rgba(3, 71, 50, 0.12);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-radius: 6px;
                }

                .description p,
                .description span {
                    font-size: 10px;
                    line-height: 1.5;
                }
                
                .discount {
                    font-size: 12px;
                    text-decoration: line-through;
                    color: #868E96;
                    font-weight: 400;
                }

                .resume-container {
                    display : flex;
                    flex-direction : row;
                    justify-content : end;
                    gap: 40px;
                    width: 100%;
                }

                .resume-table .item {
                    display: flex;
                    flex-direction: row;
                    gap: 20px;
                    align-items: center;
                    justify-content: space-between;
                }

                .resume-table .item .label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #868E96;
                }

                .resume-table .item .number {
                    font-size: 14px;
                    font-weight: 500;
                    color: #000000;
                }

                .resume-table .total .label,
                .resume-table .total .number {
                    font-size: 20px;
                    font-weight: 500;
                    color: #000000;
                }

                .comments-container .label,
                .terms-container .label {
                    font-size: 12px;
                    font-weight: 500;
                    color: #000000;
                }

                .comments,
                .terms {
                    font-size: 10px;
                    color: #000000;
                    font-weight: 400;
                    line-height: 2;
                    font-style: italic;
                }
            </style>
        </head>

        <body>
            <div class="main-container">
                <div class="header-container">
                    ${ (showLogotype && companyInfo.logotype?.url) ? `<img src="${companyInfo.logotype.url}" />` : ""}

                    <div class="fol-container">
                        <p class="fol">Cotización #${ String(data.fol).padStart(4, "0") }</p>

                        <div class="version-badge">
                            <p>Versión ${ version.fol }</p>
                        </div>
                    </div>
                </div>

                <div class="meta-container">
                    <div class="quote-from">
                        <p class="label">Cotización De:</p>
                        <p class="main-text">${companyInfo.name}</p>
                        ${ (showLegalName && companyInfo.fiscalInfo?.legalName) ? `<p class="info-text" style="margin-top: 4px">${companyInfo.fiscalInfo?.legalName}</p>` : ""}
                        ${ (showRFC && companyInfo.fiscalInfo?.rfc) ? `<p class="info-text" style="margin-top: 4px">${companyInfo.fiscalInfo?.rfc}</p>` : ""}
                        ${ (showAddress) ? `<p class="info-text" style="margin-top: 4px">${`${ street } ${ extNumber }${ intNumber ? ` ${intNumber}` : "" }<br>${suburb}, ${cp}<br>${city}, ${state}<br>${country}`}</p>` : "" }
                        ${ (showWebsite && companyInfo.website) ? `<p class="info-text" style="margin-top: 8px">${ companyInfo.website }</p>` : "" }
                    </div>

                    <div class="quote-to">
                        <p class="label">Cotización Para:</p>
                        <p class="main-text">${data.customer?.uuid ? data.customer.finalName : data.lead.finalName}</p>
                        ${ (showContactLegalName && data.customer?.uuid && data.customer.fiscalInfo?.legalName) ? `<p class="info-text" style="margin-top: 4px">${data.customer?.fiscalInfo?.legalName}</p>` : "" }
                        ${ (showContactRFC && data.customer?.uuid && data.customer.fiscalInfo?.rfc) ? `<p class="info-text" style="margin-top: 4px">${data.customer?.fiscalInfo?.rfc}</p>` : "" }
                        ${ (showContactAddress && ( contactAddressToShow === "address" && data.customer?.mainAddress ) || ( contactAddressToShow === "fiscal" && data.customer?.fiscalInfo?.address ) || ( data.lead?.mainAddress ) ) ? `<p class="info-text" style="margin-top: 4px">${ `${ contactStreet ?? "" } ${ contactExtNumber ? `#${ contactExtNumber }` : "" } ${ contactIntNumber ?? "" }
                            ${ contactSuburb ?? "" } ${ contactCp ?? "" }
                            ${ contactCity ?? "" } ${ contactState ?? "" }
                            ${ contactCountry ?? "" }`.trimStart().replace(/ +(?= )/g, "") }
                        </p>` : "" }
                    </div>

                    ${ data.deliveryAddress?.id ? `<div class="deliery-address">
                        <p class="label">Dirección de Entrega:</p>
                        <div class="address-container">
                            <img src="https://img.plasmic.app/img-optimizer/v1/img?src=https%3A%2F%2Fimg.plasmic.app%2Fimg-optimizer%2Fv1%2Fimg%2F68b537efe0c6dbf09d2dc88a349f7e68.jpg&q=75">
                            <div class="delivery-info">
                                <p class="main-text">${data.deliveryAddress.name}</p>
                                <p class="info-text" style="color: #868E96">
                                    ${ `${ deliveryStreet } ${ deliveryExtNumber }${ deliveryIntNumber ? ` ${deliveryIntNumber}` : "" }<br>${deliverySuburb}, ${deliveryCp}<br>${deliveryCity}, ${deliveryState}<br>${deliveryCountry}` }
                                </p>
                            </div>
                        </div>
                    </div>` : ""}
                </div>
            </div>

            <div class="dates-container" style="margin-top: 30px">
                <div class="date-container">
                    <p class="label">Fecha de Cotización:</p>
                    <p class="info-text">${ date }</p>
                </div>
                <div class="dueDate-container">
                    <p class="label">Fecha de Vencimiento:</p>
                    <p class="info-text">${ dueDate }</p>
                </div>
            </div>

            <div class="specs-container" style="margin-top: 30px">
                ${ (version.deliveryTime === -1 && version.deliveryTime) ? "" : `<div class="deliver-container">
                    <p class="label">Tiempo de Entrega:</p>
                    <p class="info-text">${ version.deliveryTime } ${ version.deliveryTime === 1 ? "Día" : "Días" }</p>
                </div>`}
                <div class="scheme-container">
                    <p class="label">Términos de Pago:</p>
                    <p class="info-text">${ schemeDictionary[ version.paymentScheme ] }</p>
                </div>
            </div>

            <p class="subject">
                ${version.subject}
            </p>

            <div class="table">
                <div class="header">
                    <p style="grid-column-end: span 4">Concepto</p>
                    <p style="grid-column-end: span 2; width: 100%; text-align: center;">Cantidad</p>
                    <p style="grid-column-end: span 2">Total Bruto</p>
                    <p style="grid-column-end: span 2">Impuestos</p>
                    <p style="grid-column-end: span 2">Total</p>
                </div>

                ${ version.items.map(item => {
                    const ivaDictionary = {
                        "-1": 0,
                        "0": 0,
                        "8": 0.08,
                        "16": 0.16
                    };

                    const itemDiscount = item.discount?.amount ?? 0;
                    const ivaAmount = (item.price - itemDiscount) * ivaDictionary[item.iva];

                    return `<div class="body">
                        <div style="grid-column-end: span 4">
                            <div class="product-container">
                                ${item.product.images?.length > 0 ? `
                                    <img class="product-image" src="${item.product.images[0].url}">
                                ` : `
                                    <div class="product-avatar">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#034732" viewBox="0 0 256 256" style="flex-shrink: 0;">
                                            <path d="M225.6,62.64l-88-48.17a19.91,19.91,0,0,0-19.2,0l-88,48.17A20,20,0,0,0,20,80.19v95.62a20,20,0,0,0,10.4,17.55l88,48.17a19.89,19.89,0,0,0,19.2,0l88-48.17A20,20,0,0,0,236,175.81V80.19A20,20,0,0,0,225.6,62.64ZM128,36.57,200,76,178.57,87.73l-72-39.42Zm0,78.83L56,76,81.56,62l72,39.41ZM44,96.79l72,39.4v76.67L44,173.44Zm96,116.07V136.19l24-13.13V152a12,12,0,0,0,24,0V109.92l24-13.13v76.65Z"></path>
                                        </svg>
                                    </div>
                                `}

                                <div class="product-info">
                                    <p style="font-size: 12px; font-weight: 500;">${ item.product.name }</p>
                                    <p style="font-size: 10px; font-weight: 400; color: #868E96">${ item.product.sku }</p>
                                </div>
                            </div>

                            ${item.product.description ? `<div class="description" style="margin-top: 10px">${item.product.description.replaceAll( '"', "'" )}</div>` : ""}
                        </div>

                        <div class="info-text" style="grid-column-end: span 2; width: 100%; text-align: center;">${ item.quantity } ${ item.quantity === 1 ? "Pieza" : "Piezas" }</div>


                        <div style="grid-column-end: span 2">
                            <div class="info-text">${ item.discount?.amount ? formatCurrency( (item.price - item.discount.amount) * item.quantity ) : formatCurrency( item.price ) }</div>
                            ${ item.discount?.amount ? `<div class="discount" style="margin-top: 2px;">${formatCurrency( item.price )}</div>` : ""}
                        </div>



                        <div class="info-text" style="grid-column-end: span 2">${ formatCurrency( ivaAmount * item.quantity ) }</div>
                        <div class="info-text" style="grid-column-end: span 2">${ formatCurrency( ((item.price - itemDiscount) + ivaAmount) * item.quantity ) }</div>
                    </div>`;
                }).join('')}

                <div class="resume-container" style="margin-top: 20px">
                    ${ (version.comments && version.comments !== "<p></p>") ? `
                        <div class="comments-container" style="width: 100%;">
                            <p class="label" style="margin-bottom: 4px">Comentarios</p>
                            <span class="comments">
                                ${ version.comments }
                            </span>
                        </div>` : ""}

                    <div class="resume-table" style="width: 45%; min-width: 45%">
                        <div class="item">
                            <p class="label">Subtotal</p>
                            <p class="number">${ formatCurrency( version.resume.subtotal ) }</p>
                        </div>

                        <hr>

                        ${ version.resume.individualDiscounts ? `
                            <div class="item">
                                <p class="label">Descuentos Individuales</p>
                                <p class="number">- ${ formatCurrency( individualDiscounts ) }</p>
                            </div>

                            <hr>
                        ` : ""}

                        ${ (version.resume.globalDiscount && version.resume.globalDiscount?.amount > 0) ? `
                            <div class="item">
                                <p class="label">Descuento Global</p>
                                <p class="number">- ${ formatCurrency( globalDiscount ) }</p>
                            </div>
                            
                            <hr>
                        ` : ""}

                        ${ (version.resume.globalDiscount?.amount || version.resume.individualDiscounts) ? `
                            <div class="item">
                                <p class="label">Total Bruto</p>
                                <p class="number">- ${ formatCurrency( version.resume.subtotal - individualDiscounts - globalDiscount ) }</p>
                            </div>
                            
                            <hr>
                        ` : ""}

                        <div class="item">
                            <p class="label">Impuestos</p>
                            <p class="number">${ formatCurrency( version.resume.taxes ) }</p>
                        </div>

                        <hr>

                        ${ version.resume.shipping ? `
                            <div class="item">
                                <p class="label">Envío</p>
                                <p class="number">${ formatCurrency( version.resume.shipping ) }</p>
                            </div>

                            <hr>
                        ` : ""}

                        <div class="item total">
                            <p class="label">Total</p>
                            <p class="number">${ formatCurrency( version.resume.total ) }</p>
                        </div>
                    </div>
                </div>

                ${ (version.terms && version.terms !== "<p></p>") ? `
                    <div class="terms-container" style="margin-top: 30px">
                        <p class="label">Terminos y Condiciones</p>
                        <span class="terms">${ version.terms }</span>
                    </div>
                ` : ""}

            </div>
        </body>
    </html>`;
};

module.exports = defaultEstimate;