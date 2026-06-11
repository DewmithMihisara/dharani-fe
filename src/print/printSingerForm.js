import { apiGet } from '../api/api'

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
