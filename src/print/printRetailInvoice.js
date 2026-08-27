import { apiGet } from '../api/api'

export async function printRetailInvoice(orderId, token = null) {
  const res = await apiGet('/retail-orders/' + orderId, token)
  if (res.status !== 200) return
  const o = res.data.order

  const fmt = n => (n != null && n !== '') ? Number(n).toLocaleString('en-LK') : ''
  const address = [o.permanentAddress1, o.permanentAddress2, o.permanentAddress3, o.permanentAddress4].filter(Boolean).join(', ')
  const [yyyy, mm, dd] = (o.date || '').split('-')

  const catalogueRows = (o.items || []).map(i => {
    const disc = parseFloat(i.discountPct) || 0
    const basePrice = Number(i.item_value || 0)
    const price = disc > 0 ? Math.round(basePrice * (1 - disc / 100)) : basePrice
    return { item_name: i.item_name, model: i.model, qty: i.qty || 1, total: price * (i.qty || 1) }
  })
  const singerRows = (o.singerItems || []).map(i => ({
    item_name: i.item_name, model: i.model, qty: i.qty || 1, total: Number(i.amount || 0),
  }))
  const allRows = [...catalogueRows, ...singerRows]

  const MIN_ROWS = 4
  const itemRows = allRows.map(i => `
    <tr>
      <td class="pl">${i.item_name || ''}</td>
      <td class="pl">${i.model || ''}</td>
      <td class="c">${i.qty}</td>
      <td class="r pl">${fmt(i.total)}</td>
    </tr>`).join('')
  const emptyRows = Array(Math.max(0, MIN_ROWS - allRows.length)).fill(
    '<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>'
  ).join('')

  const total = allRows.reduce((s, i) => s + i.total, 0)
  const advancePaid = o.advancePayment ? Number(o.advancePayment.advanceAmount || 0) : null
  const balanceDue = advancePaid != null ? Math.max(0, total - advancePaid) : null

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Retail Invoice</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;color:#000}
body{font-family:'Times New Roman',Times,serif;font-size:12px;color:#000;
     width:210mm;height:148.5mm;margin:0 auto;padding:2mm 5mm 2mm;
     display:flex;flex-direction:column;overflow:hidden;position:relative}
@media print{@page{size:A4 portrait;margin:0}body{padding:7mm 5mm 18mm;position:relative}.footer{position:absolute;bottom:12mm;left:5mm;right:5mm;margin-top:0;background:#fff}}

.hdr{display:flex;justify-content:space-between;align-items:flex-end;
     margin-bottom:2px;padding-bottom:2px;border-bottom:2px solid #000}
.hdr-co{font-size:15px;font-weight:bold;letter-spacing:0.3px;color:#000}
.hdr-right{font-size:10px;line-height:1.7;text-align:right;color:#000}

.doc-title{text-align:center;font-size:12px;font-weight:bold;letter-spacing:6px;
           padding:1px 0;border-bottom:1px solid #000;margin-bottom:2px;color:#000}

.info-grid{display:grid;grid-template-columns:1fr;gap:4px;margin-bottom:2px}

.cust-box{border:1px solid #000;border-radius:4px;padding:2px 8px}
.cr{display:grid;grid-template-columns:120px 9px 1fr;align-items:baseline;line-height:1.65;font-size:12px}
.cv{}

table.items{width:100%;border-collapse:collapse;flex-shrink:0}
table.items th{background:#fff;color:#000;font-weight:bold;border:1px solid #000;padding:2px 4px;text-align:center}
table.items tbody td{border-left:1px solid #000;border-right:1px solid #000;padding:2px 4px;vertical-align:middle;height:14px}
table.items tbody tr:first-child td{border-top:1px solid #000}
table.items tfoot td{border:1px solid #000;padding:2px 4px;font-weight:bold}
.pl{padding-left:4px}
.r{text-align:right;padding-right:4px}
.c{text-align:center}

.bot{display:grid;grid-template-columns:1fr 1fr;
     border:1px solid #000;border-radius:4px;overflow:hidden;
     margin-top:2px;margin-bottom:1px;flex-shrink:0}
.bb{border-right:1px solid #000;overflow:hidden}
.bb:last-child{border-right:none}
.bb-hdr{background:#fff;color:#000;font-weight:bold;font-size:10px;padding:2px 5px;
        text-transform:uppercase;letter-spacing:0.3px;border-bottom:1px solid #000}
.bb-body{padding:3px 5px}
.sr{display:grid;grid-template-columns:auto 4px 1fr;align-items:baseline;line-height:1.6;font-size:10px}
.sl{white-space:nowrap}
.sv{border-bottom:1px dotted #000}

.footer{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;margin-top:auto;
        border-top:1px solid #000;padding-top:2px}
.fi{display:flex;align-items:center;gap:4px;padding:0 5px;font-size:9px}
.fi+.fi{border-left:1px solid #000}
.fi-icon{font-size:11px;flex-shrink:0}
.fi-text{display:flex;flex-direction:column;line-height:1.4}
.fi-lbl{font-weight:bold;font-size:9px}
.fi-val{font-size:8.5px}
</style></head><body>

<div class="hdr">
  <div class="hdr-co">DHARANI CEYLON FURNITURES (Pvt.) Ltd</div>
  <div class="hdr-right">
    <strong>Invoice No.&nbsp;:</strong>&nbsp;${o.id || ''}&nbsp;&nbsp;&nbsp;
    <strong>Date&nbsp;:</strong>&nbsp;${dd || ''}/${mm || ''}/${yyyy || ''}
  </div>
</div>

<div class="doc-title">I &nbsp; N &nbsp; V &nbsp; O &nbsp; I &nbsp; C &nbsp; E</div>

<div class="info-grid">
  <div class="cust-box">
    <div class="cr"><span>Order No</span><span>:</span><span class="cv">${o.id || ''}</span></div>
    <div class="cr"><span>Customer Name</span><span>:</span><span class="cv">${o.fullNameWithInitials || ''}</span></div>
    <div class="cr"><span>Address</span><span>:</span><span class="cv">${address}</span></div>
    <div class="cr"><span>Date</span><span>:</span><span class="cv">${dd || ''} / ${mm || ''} / ${yyyy || ''}</span></div>
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th>Item</th>
      <th>Model</th>
      <th style="width:32px">Qty</th>
      <th style="width:110px">Price (LKR)</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
    ${emptyRows}
  </tbody>
  <tfoot>
    ${advancePaid == null ? `
    <tr>
      <td colspan="3" class="r" style="font-size:12px">Total :</td>
      <td class="r">LKR&nbsp;${fmt(total)}</td>
    </tr>` : `
    <tr>
      <td colspan="3" class="r" style="font-size:12px">Full Price / Total :</td>
      <td class="r">LKR&nbsp;${fmt(total)}</td>
    </tr>
    <tr>
      <td colspan="3" class="r" style="font-size:12px">Advance Paid :</td>
      <td class="r">LKR&nbsp;${fmt(advancePaid)}</td>
    </tr>
    <tr>
      <td colspan="3" class="r" style="font-size:13px">Balance Due :</td>
      <td class="r">LKR&nbsp;${fmt(balanceDue)}</td>
    </tr>`}
  </tfoot>
</table>

<div class="bot">
  <div class="bb">
    <div class="bb-hdr">Issued By</div>
    <div class="bb-body" style="padding-top:36px">
      <div class="sr"><span class="sl">Authorized Signature</span><span>:</span><span class="sv"></span></div>
    </div>
  </div>
  <div class="bb">
    <div class="bb-hdr">Customer Confirmation</div>
    <div class="bb-body" style="padding-top:36px">
      <div class="sr"><span class="sl">Customer Signature</span><span>:</span><span class="sv"></span></div>
    </div>
  </div>
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
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()
}
