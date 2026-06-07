import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export async function getBranches(token = null) {
  return apiGet('/ref/branches', token)
}

export async function getProjectsByBranch(branchId = null, token = null) {
  const path = branchId ? `/ref/projects?branchId=${branchId}` : '/ref/projects'
  return apiGet(path, token)
}

export async function getAllOrders(token = null) {
  return apiGet('/orders', token)
}

export async function getAllOrdersPaginated(pagination, token = null) {
  return apiPost('/orders/all', pagination, token)
}

export async function getOrderById(id, token = null) {
  return apiGet('/orders/' + id, token)
}

export async function deleteOrder(id, token = null) {
  return apiDelete('/orders/' + id, token)
}

export async function updateOrderStatus(orderId, body, token = null) {
  return apiPost(`/orders/${orderId}/status`, body, token)
}

export async function savePartialPayments(orderId, body, token = null) {
  return apiPost(`/orders/${orderId}/partial-payments`, body, token)
}

export async function printPartialInvoice(orderId, token = null) {
  const res = await apiGet('/orders/' + orderId, token)
  if (res.status !== 200) return
  const o = res.data.order

  const paidItems = (o.items || []).filter(i => Number(i.paidAmount || 0) > 0)
  if (!paidItems.length) return

  const fmt = n => (n != null && n !== '') ? Number(n).toLocaleString('en-LK') : ''
  const total = paidItems.reduce((s, i) => s + Number(i.paidAmount || 0), 0)
  const remark = o.history && o.history[0] ? o.history[0].remark : ''
  const address = [o.permanentAddress1, o.permanentAddress2, o.permanentAddress3, o.permanentAddress4].filter(Boolean).join(', ')
  const [yyyy, mm, dd] = (o.date || '').split('-')

  const MIN_ROWS = 4
  const itemRows = paidItems.map(i => `
    <tr>
      <td class="pl">${i.item_name || ''}</td>
      <td class="pl">${i.model || ''}</td>
      <td class="c">${i.qty || 1}</td>
      <td class="r pl">${fmt(i.paidAmount)}</td>
    </tr>`).join('')
  const emptyRows = Array(Math.max(0, MIN_ROWS - paidItems.length)).fill(
    '<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>'
  ).join('')

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Partial Payment Invoice</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Times New Roman',Times,serif;font-size:11px;color:#000;
     width:210mm;height:148.5mm;margin:0 auto;padding:6mm 10mm 4mm;
     display:flex;flex-direction:column;overflow:hidden}
@media print{@page{size:210mm 148.5mm;margin:0}body{padding:5mm 10mm 4mm}}

.hdr{display:flex;justify-content:space-between;align-items:stretch;
     border-bottom:1px solid #000;padding-bottom:5px;margin-bottom:5px}
.hdr-left{display:flex;align-items:center;gap:8px}
.company{display:flex;flex-direction:column;justify-content:center}
.co-line1{font-size:17px;line-height:1.2;letter-spacing:0.3px}
.co-line2{font-size:14px;line-height:1.2}
.hdr-right{text-align:right;font-size:9px;line-height:1.6;display:flex;align-items:stretch}
.addr-block{display:flex;flex-direction:column;justify-content:center}
.addr-bold{font-weight:bold}

.inv-title{text-align:center;font-size:14px;font-weight:bold;letter-spacing:8px;
           padding:3px 0;border-bottom:1px solid #000;margin-bottom:4px}

.cust{border:1px solid #000;padding:4px 8px;margin-bottom:4px;font-size:10px}
.cust-row{display:flex;align-items:baseline;line-height:1.85}
.cust-lbl{min-width:100px;font-weight:bold}
.cust-colon{margin:0 4px}
.cust-val{flex:1}
.date-val{display:flex;gap:2px;align-items:center}
.date-box{#000;min-width:22px;text-align:center;padding:0 2px}
.date-sep{padding:0 1px}

table.items{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:4px}
table.items th{border:1px solid #000;padding:3px 6px;text-align:center;font-weight:bold}
table.items td{border-left:1px solid #000;border-right:1px solid #000;
               padding:3px 6px;vertical-align:middle}
table.items tbody tr:first-child td{border-top:1px solid #000}
table.items tfoot td{border-top:1px solid #000;border-bottom:1px solid #000;
                     padding:3px 6px;font-weight:bold}
table.items .total-label{text-align:right;border-left:1px solid #000}
table.items .total-val{text-align:right;white-space:nowrap;border-right:1px solid #000}
.pl{padding:3px 6px}
.r{text-align:right}
.c{text-align:center}

.remark-box{border:1px solid #000;padding:3px 8px;min-height:22px;
            font-size:10px;margin-bottom:4px}
.remark-lbl{font-weight:bold}

.sigs{display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;padding-top:4px}
.sig-left{font-size:10px}
.sig-right{font-size:10px;text-align:right}
.sig-label{margin-bottom:3px;font-weight:bold}
.sig-dots{letter-spacing:2px;font-size:11px}
</style></head><body>

<div class="hdr">
  <div class="hdr-left">
    <div class="company">
      <div class="co-line1">DHARANI CEYLON</div>
      <div class="co-line2">FURNITURES (Pvt.) Ltd</div>
    </div>
  </div>
  <div class="hdr-right">
    <div class="addr-block">
      <div class="addr-bold">Head Office</div>
      <div>65/3, Hospital Rd, Malapalla, Pannipitiya</div>
      <div class="addr-bold" style="margin-top:3px">Factory Complex</div>
      <div>277/3, Madupitiya, Panadura</div>
      <div style="margin-top:3px">&#x260E;&nbsp; 072 1 501 501</div>
      <div>&#x2709;&nbsp; info@daharniceylon.lk</div>
      <div>&#x25CE;&nbsp; www.daharniceylon.lk</div>
    </div>
  </div>
</div>

<div class="inv-title">I &nbsp; N &nbsp; V &nbsp; O &nbsp; I &nbsp; C &nbsp; E</div>

<div class="cust">
  <div class="cust-row">
    <span class="cust-lbl">Order No</span><span class="cust-colon">:</span>
    <span class="cust-val">${o.id || ''}</span>
  </div>
  <div class="cust-row">
    <span class="cust-lbl">Customer Name</span><span class="cust-colon">:</span>
    <span class="cust-val">${o.fullNameWithInitials || ''}</span>
  </div>
  <div class="cust-row">
    <span class="cust-lbl">Address</span><span class="cust-colon">:</span>
    <span class="cust-val">${address}</span>
  </div>
  <div class="cust-row">
    <span class="cust-lbl">Date</span><span class="cust-colon">:</span>
    <span class="cust-val date-val">
      <span class="date-box">${dd || ''}</span>
      <span class="date-sep">/</span>
      <span class="date-box">${mm || ''}</span>
      <span class="date-sep">/</span>
      <span class="date-box" style="min-width:36px">${yyyy || ''}</span>
    </span>
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th>Item</th>
      <th>Model</th>
      <th style="width:32px">Qty</th>
      <th style="width:90px">Partially Paid (LKR)</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
    ${emptyRows}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="3" class="total-label">Total :</td>
      <td class="total-val">LKR&nbsp;${fmt(total)}</td>
    </tr>
  </tfoot>
</table>

<div class="remark-box"><span class="remark-lbl">Remark : </span>${remark || ''}</div>

<div class="sigs">
  <div class="sig-left">
    
    <div class="sig-dots">. . . . . . . . . . . . . . . . . . .</div>
    <div class="sig-label">Issued By</div>
  </div>
  <div class="sig-right">
    
    <div class="sig-dots">. . . . . . . . . . . . . . . . . . .</div>
    <div class="sig-label">Customer Signature</div>
  </div>
</div>

</body></html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0'
  document.body.appendChild(iframe)
  iframe.onload = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    iframe.contentWindow.addEventListener('afterprint', () => iframe.remove(), { once: true })
  }
  iframe.contentDocument.open()
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()
}

export async function printSingerForm(orderId, token = null) {
  const res = await apiGet('/orders/' + orderId, token)
  if (res.status !== 200) return
  const o = res.data.order

  const dateParts = (o.date || '').split('-')
  const yyyy = dateParts[0] || '', mm = dateParts[1] || '', dd = dateParts[2] || ''

  const catalogueRows = (o.items || []).map(i => {
    const disc = parseFloat(i.discountPct) || 0
    const basePrice = Number(i.item_value || 0)
    const baseMonthly = Number(i['month' + i.duration_months] || 0)
    const discountedPrice = disc > 0 ? Math.round(basePrice * (1 - disc / 100)) : basePrice
    const paid = Number(i.paidAmount || 0)
    const effectivePrice = discountedPrice - paid
    const effectiveMonthly = Math.ceil(baseMonthly * effectivePrice / basePrice)
    return {
      item_name: i.item_name,
      model: i.model,
      price_per_item: effectivePrice,
      qty: i.qty || 1,
      monthly_per_item: effectiveMonthly,
      duration_months: i.duration_months,
    }
  })

  const singerRows = (o.singerItems || []).map(i => ({
    item_name: i.item_name,
    model: i.model,
    price_per_item: Number(i.price_per_item || 0),
    qty: i.qty || 1,
    monthly_per_item: Number(i.monthly_per_item || 0),
    duration_months: null,
  }))

  const items = [...catalogueRows, ...singerRows]
  const ROWS = Math.max(3, items.length)

  const fmt = n => (n != null && n !== '') ? Number(n).toLocaleString('en-LK') : ''

  const totalCash = items.reduce((s, i) => s + (i.price_per_item || 0) * (i.qty || 1), 0)
  const totalRental = items.reduce((s, i) => s + (i.monthly_per_item || 0) * (i.qty || 1), 0)

  const itemRows = Array.from({ length: ROWS }, (_, idx) => {
    const i = items[idx]
    if (!i) return `<tr><td class="num"></td><td></td><td></td><td class="r"></td><td class="c"></td><td class="r"></td><td class="r"></td></tr>`
    const qty = i.qty || 1
    return `<tr>
      <td class="num">${idx + 1}</td>
      <td class="pl">${i.item_name || ''}</td>
      <td class="pl">${i.model || ''}</td>
      <td class="r pl">${fmt(i.price_per_item)}</td>
      <td class="c">${qty}</td>
      <td class="r pl">${fmt((i.price_per_item || 0) * qty)}</td>
      <td class="r pl">${fmt((i.monthly_per_item || 0) * qty)}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Singer Finance Offer Letter</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Times New Roman',Times,serif;font-size:13px;color:#000;
     width:210mm;margin:0 auto;padding:8mm 10mm}
@media print{body{padding:6mm 10mm}@page{size:A4;margin:0}}
.hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:10px}
.hdr-name{font-size:19px;font-weight:bold;letter-spacing:0.5px;line-height:1.5}
.hdr-addr{font-size:15px;line-height:1.6}
.customer-info{margin-bottom:8px}
.ci-row{display:flex;align-items:baseline;margin-bottom:5px;gap:3px}
.ci-label{white-space:nowrap;font-weight:bold}
.ci-label2{white-space:nowrap;font-weight:bold}
.ci-box{padding:1px 8px;min-width:90px;display:inline-block}
.date-seg{padding:1px 4px;display:inline-block}
.date-slash{margin:0 2px}
.outer{border:1px solid #aaa}
table.items{width:100%;border-collapse:collapse;font-size:12.5px}
table.items th,table.items td{border:1px solid #aaa;vertical-align:middle}
table.items th{padding:3px 4px;text-align:center;font-size:11.5px;font-weight:normal}
table.items tbody td{border-top:none;border-bottom:none}
table.items tbody tr:last-child td{border-bottom:1px solid #aaa}
table.items tfoot td{border-style:hidden}
table.items tr{height:15px}
.num{width:22px;text-align:center;padding:2px 3px}
.pl{padding:2px 5px}
.r{text-align:right;padding:2px 5px}
.c{text-align:center;padding:2px 5px}
.bot{display:flex;gap:6px;margin-top:6px}
.bot-left{border:1px solid #aaa;padding:8px 12px;min-width:200px}
.bfields{display:grid;grid-template-columns:auto auto auto;align-items:center;gap:7px 8px;font-size:13px}
.bl-label{line-height:1.3}
.bl-box{border:1px solid #000;padding:2px 6px;min-width:50px;text-align:center}
.bl-unit{white-space:nowrap}
.bot-mid{flex:1;border:1px solid #aaa;padding:8px 8px 24px}
.bot-right{flex:1;border:1px solid #aaa;padding:8px 8px 24px}
.sec-title{text-align:center;font-weight:normal;font-size:12px;margin-bottom:3px}
.offer-title{text-align:center;font-weight:bold;font-size:14px;margin:8px 0 5px}
.cond{font-size:11px;line-height:1.5;padding:0 2px}
.cond p{margin-bottom:3px}
.cond ol{margin-left:16px;margin-bottom:4px}
.cond ol li{margin-bottom:2px}
.bold{font-weight:bold}
.sig{margin-top:16px;font-size:13px}
.sig-line{border-bottom:1px solid #000;width:220px;margin-top:70px;margin-bottom:3px}
</style></head><body>

<div class="hdr">
  <div class="hdr-name">Financed by Singer Finance (Lanka) PLC</div>
  <div class="hdr-addr">No. 498, R. A. De Mel Mawatha, Colombo 03.&nbsp;&nbsp;&nbsp;Tel : 0112 400 400</div>
</div>

<div class="customer-info" style="display:grid;grid-template-columns:max-content 12px 1fr 20px max-content 12px auto;row-gap:5px;align-items:baseline">
  <span class="ci-label">Institution</span>
  <span>:</span>
  <span>${o.companyName || ''}</span>
  <span></span>
  <span class="ci-label2">EPF Number</span>
  <span>:</span>
  <span>${o.employeeId || ''}</span>

  <span class="ci-label">Customer Name</span>
  <span>:</span>
  <span>${o.fullNameWithInitials || ''}</span>
  <span></span>
  <span class="ci-label2">Date</span>
  <span>:</span>
  <span>${dd}&nbsp;/&nbsp;${mm}&nbsp;/&nbsp;${yyyy}</span>

  <span class="ci-label">Contact Number</span>
  <span>:</span>
  <span style="grid-column:3/-1">${o.mobileNumber || ''}</span>
</div>

<div class="outer">
  <table class="items">
    <thead>
      <tr>
        <th class="num"></th>
        <th style="width:30%">ITEM</th>
        <th style="width:18%">MODEL</th>
        <th style="width:13%">CASH PRICE<br>Rs</th>
        <th style="width:7%">QTY</th>
        <th style="width:16%">TOTAL CASH<br>Rs</th>
        <th style="width:16%">RENTAL</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div style="display:flex;align-items:baseline;font-weight:bold;font-size:12.5px;padding:3px 0;margin-top:2px">
    <div style="width:22px;flex-shrink:0"></div>
    <div style="flex:1;text-align:center">TOTAL</div>
    <div style="width:16%;flex-shrink:0;text-align:right;padding-right:5px;border-bottom:3px double #888">${fmt(totalCash)}</div>
    <div style="width:16%;flex-shrink:0"></div>
  </div>
</div>

<div class="bot">
  <div class="bot-left">
    <div class="bfields">
      <span class="bl-label">Total Rental<br>(Monthly)</span>
      <span class="bl-box">${fmt(totalRental)}</span>
      <span class="bl-unit">&nbsp;</span>
      <span class="bl-label">Term</span>
      <span class="bl-box">${catalogueRows[0]?.duration_months || ''}</span>
      <span class="bl-unit">M</span>
      <span class="bl-label">Interest Rate<br>(Nominal)</span>
      <span class="bl-box">&nbsp;</span>
      <span class="bl-unit">%</span>
    </div>
  </div>
  <div class="bot-mid"><div class="sec-title">Supplier Details</div></div>
  <div class="bot-right"><div class="sec-title">Singer Finance (Lanka) PLC</div></div>
</div>

<div class="offer-title">Offer Letter Group sale Facility</div>

<div class="cond">
  <div style="display:grid;grid-template-columns:max-content 12px 1fr;row-gap:3px;margin-bottom:3px">
    <span>1. Facility Amount</span><span>:</span><em>As mentioned in the Invoice</em>
    <span>2. Rental</span><span>:</span><em>As mentioned in the Invoice</em>
    <span>3. Interest Rate</span><span>:</span><em>As mentioned in the Invoice</em>
    <span>4. Default Rate</span><span>:</span><em>Not Applicable</em>
    <span style="grid-column:1/-1;margin:2px 0">5. Security Offered,<br>&nbsp;&nbsp;&nbsp;(I) Items describe in the invoice<br>&nbsp;&nbsp;&nbsp;(ii) Personal guarantee of two employees in the institute</span>
    <span>6. Due date</span><span>:</span><span>Informing via SMS</span>
  </div>
  <p class="bold" style="margin-top:5px">General Conditions</p>
  <ol>
    <li>We reserve the right to include/pass on any new taxes/levies imposed by the government from time to time.</li>
    <li>If the customer changes the current employment should be notified to the Singer Finance (Lanka) PLC.</li>
    <li>The company reserves the right to review facility at its sole discretion from time to time and discontinue or vary the terms and conditions relating thereto including but not limited to the interest in default.</li>
    <li>The facilities hereunder shall be available to you only on perfection of the security documents.</li>
    <li>In additional to the above stated terms and conditions, the facility contains herein shall be subject to all clauses, terms and condition stipulated in the agreement and other contractual documents already executed by you and any other documents which may be required to be executed by you in the future.</li>
    <li>All expenses, stamp duty, legal and other charges in this connection will be borne by you.</li>
    <li>Singer finance is not liable for the defects or title of the items described in the invoice and defects of the item or title of the ownership of the item will not be affected to the repayment of the monthly instalments.</li>
  </ol>
  <p>This offer is valid only for 07 days.</p>
  <p style="margin-top:5px">Please return the attached copy of this letter duly signed thereby indicating your understanding and acceptance of the terms and condition under which this facility is granted and of the security which is stipulated herein.</p>
  <p style="margin-top:5px">We look forward to a mutually beneficial relationship.</p>
  <p style="margin-top:8px">Yours faithfully,<br>Singer Finance (Lanka) PLC</p>
  <p style="margin-top:5px">Accepted the terms and conditions of the facility</p>
  <div class="sig">
    <div class="sig-line"></div>
    <p>Signed by the customer</p>
  </div>
</div>
</body></html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0'
  document.body.appendChild(iframe)
  iframe.onload = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    iframe.contentWindow.addEventListener('afterprint', () => iframe.remove(), { once: true })
  }
  iframe.contentDocument.open()
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()
}

export async function printPurchaseOrder(orderId, token = null) {
  const poRes = await apiPatch('/orders/' + orderId + '/print-po', null, token)
  if (poRes.status !== 200) return
  const { poNumber, printCount } = poRes.data

  const res = await apiGet('/orders/' + orderId, token)
  if (res.status !== 200) return
  const o = res.data.order

  const copyLabel = printCount === 1 ? 'ORIGINAL' : `COPY ${printCount - 1}`

  const address = [o.permanentAddress1, o.permanentAddress2, o.permanentAddress3, o.permanentAddress4]
    .filter(Boolean).join(', ')

  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const printedAt = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}  ${pad(now.getHours())}:${pad(now.getMinutes())}`

  const MIN_ROWS = 3
  const catalogueItems = o.items || []

  const dash = v => (v != null && String(v).trim() !== '') ? v : '-'
  const itemRows = catalogueItems.map((i, idx) => `
    <tr>
      <td class="num">${idx + 1}</td>
      <td>${dash(i.category)}</td>
      <td>${dash(i.item_name)}</td>
      <td>${dash(i.model)}</td>
      <td>${dash(i.name)}</td>
      <td>${dash(i.size)}</td>
      <td class="c">${i.qty || 1}</td>
      <td>${dash(i.remark)}</td>
    </tr>`).join('')

  const emptyRows = Array(Math.max(0, MIN_ROWS - catalogueItems.length)).fill(
    '<tr><td class="num">&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
  ).join('')

  const poHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Purchase Order</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Times New Roman',Times,serif;font-size:11px;color:#000;
     width:210mm;height:148.5mm;margin:0 auto;padding:5mm 10mm 4mm;
     display:flex;flex-direction:column;overflow:hidden}
@media print{@page{size:210mm 148.5mm;margin:0}body{padding:5mm 10mm 4mm}}
.hdr{display:flex;justify-content:space-between;align-items:stretch;
     border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:4px}
.hdr-left{display:flex;align-items:center;gap:8px}
.company{display:flex;flex-direction:column;justify-content:center}
.co-line1{font-size:17px;line-height:1.2;letter-spacing:0.3px}
.co-line2{font-size:14px;line-height:1.2}
.hdr-right{text-align:right;font-size:9px;line-height:1.6;display:flex;align-items:stretch}
.addr-block{display:flex;flex-direction:column;justify-content:center}
.addr-bold{font-weight:bold}
.doc-title{display:flex;justify-content:center;align-items:center;position:relative;
           font-size:14px;font-weight:bold;letter-spacing:8px;
           padding:2px 0;border-bottom:1px solid #000;margin-bottom:4px}
.info-box{border:1px solid #000;padding:4px 8px;margin-bottom:4px}
.copy-stamp{position:absolute;right:0;font-size:11px;font-weight:bold;
            border:2px solid #000;padding:1px 8px;letter-spacing:2px}
.info-row{display:flex;align-items:baseline;line-height:1.8;font-size:10px}
.info-lbl{min-width:110px;font-weight:bold}
.info-colon{margin:0 4px}
.info-val{flex:1}
table.items{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:4px}
table.items th{border:1px solid #000;padding:2px 4px;text-align:center;font-weight:bold}
table.items td{border-left:1px solid #000;border-right:1px solid #000;padding:2px 4px;vertical-align:middle}
table.items tbody tr:first-child td{border-top:1px solid #000}
table.items tbody tr:last-child td{border-bottom:1px solid #000}
.num{text-align:center;width:20px}
.c{text-align:center}
.footer{margin-top:auto;padding-top:6px}
.sig-dots{letter-spacing:2px;font-size:11px}
.sig-label{font-size:10px;font-weight:bold;margin-top:2px}
</style></head><body>

<div class="hdr">
  <div class="hdr-left">
    <div class="company">
      <div class="co-line1">DHARANI CEYLON</div>
      <div class="co-line2">FURNITURES (Pvt.) Ltd</div>
    </div>
  </div>
  <div class="hdr-right">
    <div class="addr-block">
      <div class="addr-bold">Head Office</div>
      <div>65/3, Hospital Rd, Malapalla, Pannipitiya</div>
      <div class="addr-bold" style="margin-top:3px">Factory Complex</div>
      <div>277/3, Madupitiya, Panadura</div>
      <div style="margin-top:3px">&#x260E;&nbsp; 072 1 501 501</div>
      <div>&#x2709;&nbsp; info@daharniceylon.lk</div>
      <div>&#x25CE;&nbsp; www.daharniceylon.lk</div>
    </div>
  </div>
</div>

<div class="doc-title">
  P U R C H A S E &nbsp; O R D E R
  <div class="copy-stamp">${copyLabel}</div>
</div>

<div class="info-box">
  <div class="info-row">
    <span class="info-lbl">PO No.</span><span class="info-colon">:</span>
    <span class="info-val">${poNumber}</span>
  </div>
  <div class="info-row">
    <span class="info-lbl">Order No.</span><span class="info-colon">:</span>
    <span class="info-val">${o.id || ''}</span>
  </div>
  <div class="info-row">
    <span class="info-lbl">Customer Name</span><span class="info-colon">:</span>
    <span class="info-val">${o.fullNameWithInitials || ''}</span>
  </div>
  <div class="info-row">
    <span class="info-lbl">Address</span><span class="info-colon">:</span>
    <span class="info-val">${address}</span>
  </div>
  <div class="info-row">
    <span class="info-lbl">Printed</span><span class="info-colon">:</span>
    <span class="info-val">${printedAt}</span>
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th class="num">#</th>
      <th style="width:12%">Category</th>
      <th style="width:14%">Item</th>
      <th style="width:14%">Model</th>
      <th style="width:12%">Name</th>
      <th style="width:12%">Size</th>
      <th class="c" style="width:28px">Qty</th>
      <th style="width:24%">Remark</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
    ${emptyRows}
  </tbody>
</table>

<div class="footer">
  <div class="sig-dots">. . . . . . . . . . . . . . . . . . . . . . . .</div>
  <div class="sig-label">Issued By</div>
</div>

</body></html>`

  const poIframe = document.createElement('iframe')
  poIframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0'
  document.body.appendChild(poIframe)
  poIframe.onload = () => {
    poIframe.contentWindow.focus()
    poIframe.contentWindow.print()
    poIframe.contentWindow.addEventListener('afterprint', () => poIframe.remove(), { once: true })
  }
  poIframe.contentDocument.open()
  poIframe.contentDocument.write(poHtml)
  poIframe.contentDocument.close()
}

export async function printDeliveryNote(orderId, token = null) {
  const res = await apiGet('/orders/' + orderId, token)
  if (res.status !== 200) return
  const o = res.data.order

  const [yyyy, mm, dd] = (o.date || '').split('-')
  const dateStr = `${dd || ''} / ${mm || ''} / ${yyyy || ''}`
  const fmt = n => (n != null && n !== '') ? Number(n).toLocaleString('en-LK') : ''
  const d = o.delivery || {}

  const addrParts = [o.permanentAddress1, o.permanentAddress2, o.permanentAddress3, o.permanentAddress4].filter(Boolean)
  const addrLine1 = addrParts.slice(0, 2).join(', ')
  const addrLine2 = addrParts.slice(2).join(', ')

  const catalogueItems = (o.items || []).map(i => ({
    desc: (i.item_name || '') + (i.qty > 1 ? ` (x${i.qty})` : ''),
    model: i.model || '',
    unitPrice: Number(i.item_value || 0),
    qty: i.qty || 1,
    period: i.duration_months ? `${i.duration_months} Months` : '—',
    instalment: Number(i['month' + i.duration_months] || 0) * (i.qty || 1),
  }))

  const singerItems = (o.singerItems || []).map(i => ({
    desc: (i.item_name || '') + (i.qty > 1 ? ` (x${i.qty})` : ''),
    model: i.model || '',
    unitPrice: Number(i.price_per_item || 0),
    qty: i.qty || 1,
    period: '—',
    instalment: Number(i.monthly_per_item || 0) * (i.qty || 1),
  }))

  const allItems = [...catalogueItems, ...singerItems]
  const ROWS = Math.max(3, allItems.length)

  const totalUnitPrice = allItems.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const totalInstalment = allItems.reduce((s, i) => s + i.instalment, 0)

  const itemRows = Array.from({ length: ROWS }, (_, idx) => {
    const i = allItems[idx]
    const num = String(idx + 1).padStart(2, '0')
    if (!i) return `<tr><td class="num"></td><td class="pl"></td><td class="pl"></td><td class="r"></td><td class="c"></td><td class="r"></td></tr>`
    return `<tr>
      <td class="num">${num}</td>
      <td class="pl">${i.desc}</td>
      <td class="pl">${i.model}</td>
      <td class="r">${fmt(i.unitPrice)}</td>
      <td class="c">${i.period}</td>
      <td class="r">${fmt(i.instalment)}</td>
    </tr>`
  }).join('')

  const dnHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Delivery Note</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#000;
     width:210mm;height:148.5mm;margin:0 auto;padding:4mm 6mm 3mm;
     display:flex;flex-direction:column;overflow:hidden}
@media print{@page{size:210mm 148.5mm;margin:0}body{padding:4mm 6mm 3mm}}

.hdr{display:flex;justify-content:space-between;align-items:flex-end;
     margin-bottom:4px;padding-bottom:3px;border-bottom:2px solid #000}
.hdr-co{font-size:16px;font-weight:bold;letter-spacing:0.3px}
.hdr-right{font-size:9px;line-height:1.9;text-align:right}

.info-grid{display:grid;grid-template-columns:1fr 210px;gap:5px;margin-bottom:4px}

.cust-box{border:1px solid #000;border-radius:4px;padding:3px 8px}
.cr{display:grid;grid-template-columns:110px 9px 1fr;align-items:baseline;line-height:1.85;font-size:9px}
.cv{}
.addr2-row{display:grid;grid-template-columns:110px 9px 1fr;font-size:9px}
.addr2{min-height:12px;line-height:1.85}

.veh-box{border:1px solid #000;border-radius:4px;overflow:hidden}
.veh-hdr{background:#000;color:#fff;font-weight:bold;font-size:8px;padding:2px 7px;
         text-transform:uppercase;letter-spacing:0.3px}
.veh-table{width:100%;border-collapse:collapse}
.veh-table td{padding:3px 7px;font-size:8.5px;vertical-align:middle}
.vl{width:58%}
.vv{}

table.items{width:100%;border-collapse:collapse;font-size:9px;flex-shrink:0}
table.items th{background:#000;color:#fff;font-weight:bold;border:1px solid #000;padding:2px 4px;text-align:center}
table.items tbody td{border-left:1px solid #000;border-right:1px solid #000;padding:2px 4px;vertical-align:middle;height:12px}
table.items tfoot td{border:1px solid #000;padding:2px 4px;font-weight:bold}
.num{text-align:center;width:22px}
.pl{padding-left:4px}
.r{text-align:right;padding-right:4px}
.c{text-align:center}
.dot{border-bottom:1px dotted #000!important}

.bot{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;
     border:1px solid #000;border-radius:4px;overflow:hidden;
     margin-top:3px;margin-bottom:2px;flex-shrink:0}
.bb{border-right:1px solid #000;overflow:hidden}
.bb:last-child{border-right:none}
.bb-hdr{background:#000;color:#fff;font-weight:bold;font-size:8px;padding:2px 5px;
        text-transform:uppercase;letter-spacing:0.3px}
.bb-body{padding:3px 5px}
.sr{display:grid;grid-template-columns:auto 4px 1fr;align-items:baseline;line-height:1.75;font-size:8px}
.sl{white-space:nowrap}
.sv{border-bottom:1px solid #000}
.dotrow{border-bottom:1px dotted #000;min-height:12px;margin-bottom:2px}

.warranty{text-align:center;font-style:italic;font-size:7.5px;color:#000;margin:2px 0}

.ty-wrap{display:flex;align-items:center;gap:6px;margin:2px 0}
.ty-line{flex:1;height:1px;background:#000}
.ty-text{font-style:italic;font-size:10px;white-space:nowrap;font-family:'Times New Roman',Times,serif}

.footer{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;margin-top:auto;
        border-top:1px solid #000;padding-top:2px}
.fi{display:flex;align-items:center;gap:4px;padding:0 5px;font-size:8px}
.fi+.fi{border-left:1px solid #000}
.fi-icon{font-size:10px;flex-shrink:0}
.fi-text{display:flex;flex-direction:column;line-height:1.4}
.fi-lbl{font-weight:bold;font-size:8px}
.fi-val{font-size:7.5px}
</style></head><body>

<div class="hdr">
  <div class="hdr-co">DHARANI CEYLON FURNITURES (Pvt.) Ltd</div>
  <div class="hdr-right">
    <strong>Order No.&nbsp;:</strong>&nbsp;${o.id || ''}&nbsp;&nbsp;&nbsp;
    <strong>Date&nbsp;:</strong>&nbsp;${dateStr}
  </div>
</div>

<div class="info-grid">
  <div class="cust-box">
    <div class="cr"><span>Customer Name</span><span>:</span><span class="cv">${o.fullNameWithInitials || ''}</span></div>
    <div class="cr"><span>Employer No</span><span>:</span><span class="cv">${o.employeeId || ''}</span></div>
    <div class="cr"><span>Company Name</span><span>:</span><span class="cv">${o.companyName || ''}</span></div>
    <div class="cr"><span>Delivery Address</span><span>:</span><span class="cv">${addrLine1}</span></div>
    ${addrLine2 ? `<div class="addr2-row"><span></span><span></span><span class="addr2">${addrLine2}</span></div>` : ''}
    <div class="cr"><span>Customer Phone No 01</span><span>:</span><span class="cv">${o.mobileNumber || ''}</span></div>
    <div class="cr"><span>Customer Phone No 02</span><span>:</span><span class="cv">${o.landlineNumber || ''}</span></div>
  </div>
  <div class="veh-box">
    <div class="veh-hdr">Vehicle &amp; Delivery Details</div>
    <table class="veh-table">
      <tr><td class="vl">Delivery Vehicle No.</td><td class="vv">${d.vehicleNumber || ''}</td></tr>
      <tr><td class="vl">Meter Start Reading</td><td class="vv">${d.meterStart || ''}</td></tr>
      <tr><td class="vl">Meter End Reading</td><td class="vv">${o.status === 'DELIVERED' ? (d.meterEnd || '') : ''}</td></tr>
      <tr><td class="vl">Delivery Date &amp; Time</td><td class="vv"></td></tr>
    </table>
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th class="num">No.</th>
      <th style="width:30%">Item Description</th>
      <th style="width:17%">Model</th>
      <th style="width:13%">Unit Price (Rs.)</th>
      <th style="width:15%">Instalment Payment Period</th>
      <th style="width:15%">Instalment Amount (Rs.)</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
  <tfoot>
    <tr>
      <td colspan="3" class="r" style="font-size:9px">TOTAL UNIT PRICE (Rs.)</td>
      <td class="r">${fmt(totalUnitPrice)}</td>
      <td class="c" style="font-size:9px">TOTAL INSTALMENT AMOUNT (Rs.)</td>
      <td class="r">${fmt(totalInstalment)}</td>
    </tr>
  </tfoot>
</table>

<div class="bot">
  <div class="bb">
    <div class="bb-hdr">Special Notes</div>
    <div class="bb-body">
      <div class="dotrow"></div>
      <div class="dotrow"></div>
      <div class="dotrow"></div>
    </div>
  </div>
  <div class="bb">
    <div class="bb-hdr">Customer Confirmation</div>
    <div class="bb-body">
      <div class="sr"><span class="sl">Customer Received Signature</span><span>:</span><span class="sv"></span></div>
      <div class="sr"><span class="sl">Name with Initials</span><span>:</span><span class="sv"></span></div>
      <div class="sr"><span class="sl">NIC No</span><span>:</span><span class="sv"></span></div>
      <div class="sr"><span class="sl">Date</span><span>:</span><span class="sv"></span></div>
    </div>
  </div>
  <div class="bb">
    <div class="bb-hdr">Delivered By</div>
    <div class="bb-body">
      <div class="sr"><span class="sl">Driver Name</span><span>:</span><span class="sv">${d.driverName || ''}</span></div>
      <div class="sr"><span class="sl">Driver Signature</span><span>:</span><span class="sv"></span></div>
      <div class="sr"><span class="sl">Date</span><span>:</span><span class="sv"></span></div>
    </div>
  </div>
  <div class="bb">
    <div class="bb-hdr">Checked &amp; Authorized By</div>
    <div class="bb-body">
      <div class="sr"><span class="sl">Name</span><span>:</span><span class="sv"></span></div>
      <div class="sr"><span class="sl">Signature</span><span>:</span><span class="sv"></span></div>
      <div class="sr"><span class="sl">Date</span><span>:</span><span class="sv"></span></div>
    </div>
  </div>
</div>

<div class="warranty">This delivery note serves as the warranty document for the above listed items.</div>

<div class="ty-wrap">
  <div class="ty-line"></div>
  <div class="ty-text">Thank You for Choosing Dharani Ceylon</div>
  <div class="ty-line"></div>
</div>

<div class="footer">
  <div class="fi">
    <span class="fi-icon">&#x260E;</span>
    <div class="fi-text"><span class="fi-lbl">Hotline</span><span class="fi-val">072 1 501 501</span></div>
  </div>
  <div class="fi">
    <span class="fi-icon">&#x2709;</span>
    <div class="fi-text"><span class="fi-lbl">E-mail</span><span class="fi-val">info@dharaniceylon.lk</span></div>
  </div>
  <div class="fi">
    <span class="fi-icon">&#x25CE;</span>
    <div class="fi-text"><span class="fi-lbl">Website</span><span class="fi-val">www.dharaniceylon.lk</span></div>
  </div>
  <div class="fi">
    <span class="fi-icon">&#x25CF;</span>
    <div class="fi-text"><span class="fi-lbl">Address</span><span class="fi-val">65/3, Hospital Road, Malapalla, Pannipitiya</span></div>
  </div>
</div>

</body></html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0'
  document.body.appendChild(iframe)
  iframe.onload = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    iframe.contentWindow.addEventListener('afterprint', () => iframe.remove(), { once: true })
  }
  iframe.contentDocument.open()
  iframe.contentDocument.write(dnHtml)
  iframe.contentDocument.close()
}
