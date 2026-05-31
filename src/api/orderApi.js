import { apiGet, apiDelete, apiPost } from './api'

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

export async function printSingerForm(orderId, token = null) {
  const res = await apiGet('/orders/' + orderId, token)
  if (res.status !== 200) return
  const o = res.data.order

  const dateParts = (o.date || '').split('-')
  const yyyy = dateParts[0] || '', mm = dateParts[1] || '', dd = dateParts[2] || ''

  const ROWS = 5
  const items = (o.items || []).slice(0, ROWS)

  const fmt = n => (n != null && n !== '') ? Number(n).toLocaleString('en-LK') : ''
  const rental = i => (i.item_value && i.duration_months)
    ? Math.ceil(Number(i.item_value) / i.duration_months)
    : null

  const totalCash   = items.reduce((s, i) => s + (Number(i.item_value) || 0), 0)
  const totalRental = items.reduce((s, i) => s + (rental(i) || 0), 0)

  const itemRows = Array.from({ length: ROWS }, (_, idx) => {
    const i = items[idx]
    const num = idx + 1
    if (!i) return `<tr><td class="num">${num}</td><td></td><td></td><td class="r"></td><td class="r"></td><td class="c"></td></tr>`
    const r = rental(i)
    return `<tr>
      <td class="num">${num}</td>
      <td class="pl">${i.item_name || ''}</td>
      <td class="pl">${i.model || ''}</td>
      <td class="r pl">${fmt(i.item_value)}</td>
      <td class="r pl">${r != null ? fmt(r) : ''}</td>
      <td class="c">${i.duration_months ? i.duration_months + ' M' : ''}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Singer Finance Offer Letter</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Courier New',Courier,monospace;font-size:12px;color:#000;
     width:210mm;margin:0 auto;padding:8mm 10mm}
@media print{body{padding:6mm 10mm}@page{size:A4;margin:0}}
.hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:10px}
.hdr-name{font-size:16px;font-weight:bold;letter-spacing:0.5px;line-height:1.5}
.hdr-addr{font-size:13px;line-height:1.6}
.customer-info{margin-bottom:8px}
.ci-row{display:flex;align-items:baseline;margin-bottom:5px;gap:3px}
.ci-label{min-width:140px;white-space:nowrap;font-weight:bold}
.ci-colon{margin-right:3px}
.ci-val{border-bottom:1px dotted #777;flex:1;padding-left:4px;min-height:15px}
.ci-gap{min-width:30px}
.ci-label2{white-space:nowrap;font-weight:bold}
.ci-box{border:1px solid #000;padding:1px 8px;min-width:90px;text-align:center;display:inline-block}
.date-seg{border:1px solid #000;padding:1px 7px;min-width:30px;text-align:center;display:inline-block}
.date-slash{margin:0 2px}
.outer{border:1.5px solid #000}
table.items{width:100%;border-collapse:collapse;font-size:11.5px}
table.items th,table.items td{border:1px solid #000;vertical-align:middle}
table.items th{padding:3px 4px;text-align:center;font-size:10.5px;font-weight:bold}
table.items tr{height:32px}
.num{width:22px;text-align:center;padding:2px 3px}
.pl{padding:2px 5px}
.r{text-align:right;padding:2px 5px}
.c{text-align:center;padding:2px 5px}
.bot{display:flex;border-top:1px solid #000}
.bot-left{border-right:1px solid #000;padding:8px 12px;min-width:200px}
.bfields{display:grid;grid-template-columns:auto auto auto;align-items:center;gap:7px 8px;font-size:12px}
.bl-label{white-space:nowrap}
.bl-box{border:1px solid #000;padding:2px 6px;min-width:85px;text-align:center}
.bl-unit{white-space:nowrap}
.bot-mid{flex:1;border-right:1px solid #000;padding:6px 8px}
.bot-right{flex:1;padding:6px 8px}
.sec-title{text-align:center;font-weight:bold;font-size:12px;margin-bottom:3px}
.offer-title{text-align:center;font-weight:bold;font-size:13px;margin:8px 0 5px}
.cond{font-size:10px;line-height:1.5;padding:0 2px}
.cond p{margin-bottom:3px}
.cond ol{margin-left:16px;margin-bottom:4px}
.cond ol li{margin-bottom:2px}
.bold{font-weight:bold}
.sig{margin-top:16px;font-size:12px}
.sig-line{border-bottom:1px solid #000;width:220px;margin-top:70px;margin-bottom:3px}
</style></head><body>

<div class="hdr">
  <div class="hdr-name">Financed by Singer Finance (Lanka) PLC</div>
  <div class="hdr-addr">No. 498, R. A. De Mel Mawatha, Colombo 03.&nbsp;&nbsp;&nbsp;Tel : 0112 400 400</div>
</div>

<div class="customer-info">
  <div class="ci-row">
    <span class="ci-label">Institution</span>
    <span class="ci-colon">:</span>
    <span class="ci-val">${o.companyName || ''}</span>
    <span class="ci-gap"></span>
    <span class="ci-label2">EPF Number</span>
    <span class="ci-colon">:</span>
    <span class="ci-box">${o.employeeId || ''}</span>
  </div>
  <div class="ci-row">
    <span class="ci-label">Customer Name</span>
    <span class="ci-colon">:</span>
    <span class="ci-val">${o.fullNameWithInitials || ''}</span>
    <span class="ci-gap"></span>
    <span class="ci-label2">Date</span>
    <span class="ci-colon">:</span>
    <span class="date-seg">${dd}</span><span class="date-slash">/</span><span class="date-seg">${mm}</span><span class="date-slash">/</span><span class="date-seg">${yyyy}</span>
  </div>
  <div class="ci-row">
    <span class="ci-label">Contact Number</span>
    <span class="ci-colon">:</span>
    <span class="ci-val">${o.mobileNumber || ''}</span>
  </div>
</div>

<div class="outer">
  <table class="items">
    <thead>
      <tr>
        <th class="num"></th>
        <th style="width:34%">ITEM</th>
        <th style="width:20%">MODEL</th>
        <th style="width:16%">CASH PRICE<br>Rs</th>
        <th style="width:14%">RENTAL</th>
        <th style="width:10%">TERM</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr style="font-weight:bold">
        <td class="num"></td>
        <td colspan="2" class="c">TOTAL</td>
        <td class="r pl">${fmt(totalCash)}</td>
        <td class="r pl">${fmt(totalRental)}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <div class="bot">
    <div class="bot-left">
      <div class="bfields">
        <span class="bl-label">Total Rental (Monthly)</span>
        <span class="bl-box">${fmt(totalRental)}</span>
        <span class="bl-unit">&nbsp;</span>
        <span class="bl-label">Term</span>
        <span class="bl-box">&nbsp;</span>
        <span class="bl-unit">M</span>
        <span class="bl-label">Interest Rate (Nominal)</span>
        <span class="bl-box">&nbsp;</span>
        <span class="bl-unit">%</span>
      </div>
    </div>
    <div class="bot-mid"><div class="sec-title">Supplier Details</div></div>
    <div class="bot-right"><div class="sec-title">Singer Finance (Lanka) PLC</div></div>
  </div>
</div>

<div class="offer-title">Offer Letter Group sale Facility</div>

<div class="cond">
  <p>1. Facility Amount &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <em>As mentioned in the Invoice</em></p>
  <p>2. Rental &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <em>As mentioned in the Invoice</em></p>
  <p>3. Interest Rate &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <em>As mentioned in the Invoice</em></p>
  <p>4. Default Rate &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <em>Not Applicable</em></p>
  <p>5. Security Offered,<br>
  &nbsp;&nbsp;&nbsp;(I) Items describe in the invoice<br>
  &nbsp;&nbsp;&nbsp;(ii) Personal guarantee of two employees in the institute</p>
  <p>6. Due date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : Informing via SMS</p>
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
