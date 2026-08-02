import { apiGet } from '../api/api'

export async function printRetailDeliveryNote(orderId, token = null) {
  const res = await apiGet('/retail-orders/' + orderId, token)
  if (res.status !== 200) return
  const o = res.data.order

  const [yyyy, mm, dd] = (o.date || '').split('-')
  const dateStr = `${dd || ''} / ${mm || ''} / ${yyyy || ''}`
  const fmt = n => (n != null && n !== '') ? Number(n).toLocaleString('en-LK') : ''
  const d = o.delivery || {}

  const onDeliveryRemark = (o.history || []).find(h => h.status === 'ON_DELIVERY')?.remark?.trim() || ''

  const addrParts = [o.permanentAddress1, o.permanentAddress2, o.permanentAddress3, o.permanentAddress4].filter(Boolean)
  const addrLine1 = addrParts.slice(0, 2).join(', ')
  const addrLine2 = addrParts.slice(2).join(', ')

  const catalogueItems = (o.items || []).map(i => ({
    desc: (i.item_name || '') + (i.qty > 1 ? ` (x${i.qty})` : ''),
    model: i.model || '',
    unitPrice: Number(i.item_value || 0),
    qty: i.qty || 1,
    total: Number(i.item_value || 0) * (i.qty || 1),
  }))

  const singerItems = (o.singerItems || []).map(i => ({
    desc: (i.item_name || '') + (i.qty > 1 ? ` (x${i.qty})` : ''),
    model: i.model || '',
    unitPrice: Number(i.price_per_item || 0),
    qty: i.qty || 1,
    total: Number(i.amount || 0),
  }))

  const allItems = [...catalogueItems, ...singerItems]
  const ROWS = Math.max(3, allItems.length)

  const totalUnitPrice = allItems.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const totalAmount = allItems.reduce((s, i) => s + i.total, 0)

  const itemRows = Array.from({ length: ROWS }, (_, idx) => {
    const i = allItems[idx]
    const num = String(idx + 1).padStart(2, '0')
    if (!i) return `<tr><td class="num"></td><td class="pl"></td><td class="pl"></td><td class="r"></td><td class="c"></td><td class="r"></td></tr>`
    return `<tr>
      <td class="num">${num}</td>
      <td class="pl">${i.desc}</td>
      <td class="pl">${i.model}</td>
      <td class="r">${fmt(i.unitPrice)}</td>
      <td class="c">${i.qty}</td>
      <td class="r">${fmt(i.total)}</td>
    </tr>`
  }).join('')

  const dnHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Delivery Note</title>
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

.info-grid{display:grid;grid-template-columns:1fr 200px;gap:4px;margin-bottom:2px}

.cust-box{border:1px solid #000;border-radius:4px;padding:2px 8px}
.cr{display:grid;grid-template-columns:130px 9px 1fr;align-items:baseline;line-height:1.65;font-size:12px}
.cv{}
.addr2-row{display:grid;grid-template-columns:130px 9px 1fr;font-size:12px}
.addr2{min-height:12px;line-height:1.65}

.veh-box{border:1px solid #000;border-radius:4px;overflow:hidden}
.veh-hdr{background:#fff;color:#000;font-weight:bold;font-size:10px;padding:2px 7px;
         text-transform:uppercase;letter-spacing:0.3px;border-bottom:1px solid #000}
.veh-table{width:100%;border-collapse:collapse}
.veh-table td{padding:2px 7px;font-size:10px;vertical-align:middle}
.vl{width:58%}
.vv{}

table.items{width:100%;border-collapse:collapse;flex-shrink:0}
table.items th{background:#fff;color:#000;font-weight:bold;border:1px solid #000;padding:2px 4px;text-align:center}
table.items tbody td{border-left:1px solid #000;border-right:1px solid #000;padding:2px 4px;vertical-align:middle;height:14px}
table.items tfoot td{border:1px solid #000;padding:2px 4px;font-weight:bold}
.num{text-align:center;width:22px}
.pl{padding-left:4px}
.r{text-align:right;padding-right:4px}
.c{text-align:center}
.dot{border-bottom:1px dotted #000!important}

.bot{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;
     border:1px solid #000;border-radius:4px;overflow:hidden;
     margin-top:2px;margin-bottom:1px;flex-shrink:0}
.bb{border-right:1px solid #000;overflow:hidden}
.bb:last-child{border-right:none}
.bb-hdr{background:#fff;color:#000;font-weight:bold;font-size:10px;padding:2px 5px;
        text-transform:uppercase;letter-spacing:0.3px;border-bottom:1px solid #000}
.bb-body{padding:3px 5px;min-height:50px}
.sr{display:grid;grid-template-columns:auto 4px 1fr;align-items:baseline;line-height:1.6;font-size:10px}
.sl{white-space:nowrap}
.sv{border-bottom:1px solid #000}
.dotrow{border-bottom:1px dotted #000;min-height:14px;margin-bottom:2px}
.note-text{font-size:10px;line-height:1.5;white-space:pre-wrap;word-break:break-word}

.warranty{text-align:center;font-style:italic;font-size:9px;color:#000!important;margin:2px 0}

.ty-wrap{display:flex;align-items:center;gap:6px;margin:2px 0}
.ty-line{flex:1;height:1px;background:#000}
.ty-text{font-style:italic;font-size:11px;white-space:nowrap;font-family:'Times New Roman',Times,serif}

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
    <strong>Order No.&nbsp;:</strong>&nbsp;${o.id || ''}&nbsp;&nbsp;&nbsp;
    <strong>Date&nbsp;:</strong>&nbsp;${dateStr}
  </div>
</div>

<div class="doc-title">D E L I V E R Y &nbsp; N O T E &nbsp; (R E T A I L)</div>

<div class="info-grid">
  <div class="cust-box">
    <div class="cr"><span>Customer Name</span><span>:</span><span class="cv">${o.fullNameWithInitials || ''}</span></div>
    <div class="cr"><span>NIC No</span><span>:</span><span class="cv">${o.nicNumber || ''}</span></div>
    <div class="cr"><span>Delivery Address</span><span>:</span><span class="cv">${addrLine1}</span></div>
    ${addrLine2 ? `<div class="addr2-row"><span></span><span></span><span class="addr2">${addrLine2}</span></div>` : ''}
    <div class="cr"><span>Customer Phone No 01</span><span>:</span><span class="cv">${o.mobileNumber1 || ''}</span></div>
    <div class="cr"><span>Customer Phone No 02</span><span>:</span><span class="cv">${o.mobileNumber2 || ''}</span></div>
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
      <th style="width:32%">Item Description</th>
      <th style="width:18%">Model</th>
      <th style="width:15%">Unit Price (Rs.)</th>
      <th style="width:10%">Qty</th>
      <th style="width:15%">Total (Rs.)</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
  <tfoot>
    <tr>
      <td colspan="3" class="r" style="font-size:8px">TOTAL UNIT PRICE (Rs.)</td>
      <td class="r">${fmt(totalUnitPrice)}</td>
      <td class="c" style="font-size:8px">TOTAL (Rs.)</td>
      <td class="r">${fmt(totalAmount)}</td>
    </tr>
  </tfoot>
</table>

<div class="bot">
  <div class="bb">
    <div class="bb-hdr">Special Notes</div>
    <div class="bb-body">
      ${onDeliveryRemark
        ? `<div class="note-text">${onDeliveryRemark}</div>`
        : `<div class="dotrow"></div>
      <div class="dotrow"></div>
      <div class="dotrow"></div>`}
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
