import { apiGet, apiPatch } from '../api/api'

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
      <td>${dash(i.item_name)}</td>
      <td>${dash(i.model)}</td>
      <td>${dash(i.name)}</td>
      <td>${dash(i.size)}</td>
      <td class="c">${i.qty || 1}</td>
      <td class="r">${i.transferPrice != null ? (Number(i.transferPrice) * (i.qty || 1)).toLocaleString('en-LK') : '-'}</td>
      <td>${dash(i.remark)}</td>
    </tr>`).join('')

  const emptyRows = Array(Math.max(0, MIN_ROWS - catalogueItems.length)).fill(
    '<tr><td class="num">&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
  ).join('')

  const poHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Purchase Order</title>
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

.doc-title{display:flex;justify-content:center;align-items:center;position:relative;
           font-size:12px;font-weight:bold;letter-spacing:6px;
           padding:1px 0;border-bottom:1px solid #000;margin-bottom:2px;color:#000}
.copy-stamp{position:absolute;right:0;font-size:10px;font-weight:bold;
            border:1.5px solid #000;padding:0px 6px;letter-spacing:1px;text-transform:uppercase}

.info-grid{display:grid;grid-template-columns:1fr;gap:4px;margin-bottom:2px}
.info-box{border:1px solid #000;border-radius:4px;padding:2px 8px;display:grid;grid-template-columns:1fr 1fr;column-gap:12px}
.cr{display:grid;grid-template-columns:120px 9px 1fr;align-items:baseline;line-height:1.65;font-size:12px}
.cv{}

table.items{width:100%;border-collapse:collapse;flex-shrink:0}
table.items th{background:#fff;color:#000;font-weight:bold;border:1px solid #000;padding:2px 4px;text-align:center}
table.items tbody td{border-left:1px solid #000;border-right:1px solid #000;padding:2px 4px;vertical-align:middle;height:14px}
table.items tbody tr:first-child td{border-top:1px solid #000}
table.items tbody tr:last-child td{border-bottom:1px solid #000}
.num{text-align:center;width:16px}
.c{text-align:center}.r{text-align:right}

.bot{display:grid;grid-template-columns:1fr 2fr;
     border:1px solid #000;border-radius:4px;overflow:hidden;
     margin-top:2px;margin-bottom:1px;flex-shrink:0}
.bb{border-right:1px solid #000;overflow:hidden}
.bb:last-child{border-right:none}
.bb-hdr{background:#fff;color:#000;font-weight:bold;font-size:10px;padding:2px 5px;
        text-transform:uppercase;letter-spacing:0.3px;border-bottom:1px solid #000}
.bb-body{padding:3px 5px}
.sr{display:grid;grid-template-columns:auto 4px 1fr;align-items:baseline;line-height:1.6;font-size:10px}
.sl{white-space:nowrap}
.sv{border-bottom:1px solid #000}

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
    <strong>PO No.&nbsp;:</strong>&nbsp;${poNumber}&nbsp;&nbsp;&nbsp;
    <strong>Order No.&nbsp;:</strong>&nbsp;${o.id || ''}
  </div>
</div>

<div class="doc-title">
  P U R C H A S E &nbsp; O R D E R
  <div class="copy-stamp">${copyLabel}</div>
</div>

<div class="info-grid">
  <div class="info-box">
    <div class="cr"><span>PO No.</span><span>:</span><span class="cv">${poNumber}</span></div>
    <div class="cr"><span>Order No.</span><span>:</span><span class="cv">${o.id || ''}</span></div>
    <div class="cr"><span>Customer Name</span><span>:</span><span class="cv">${o.fullNameWithInitials || ''}</span></div>
    <div class="cr"><span>EPF No.</span><span>:</span><span class="cv">${o.employeeId || ''}</span></div>
    <div class="cr"><span>Mobile No.</span><span>:</span><span class="cv">${o.mobileNumber || ''}</span></div>
    <div class="cr"><span>${o.maritalStatus === 'Married' ? 'Spouse Contact' : 'Landline No.'}</span><span>:</span><span class="cv">${o.maritalStatus === 'Married' ? (o.spouseContactNumber || '') : (o.landlineNumber || '')}</span></div>
    <div class="cr"><span>Address</span><span>:</span><span class="cv">${address}</span></div>
    <div class="cr"><span>Printed</span><span>:</span><span class="cv">${printedAt}</span></div>
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th class="num">#</th>
      <th style="width:16%">Item</th>
      <th style="width:16%">Model</th>
      <th style="width:10%">Name</th>
      <th style="width:10%">Size</th>
      <th class="c" style="width:22px">Qty</th>
      <th class="r" style="width:10%">Transfer Price</th>
      <th style="width:30%">Remark</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
    ${emptyRows}
  </tbody>
</table>

<div class="bot">
  <div class="bb">
    <div class="bb-hdr">Issued By</div>
    <div class="bb-body" style="padding-top:36px">
      <div class="sr"><span class="sl">Authorized Signature</span><span>:</span><span class="sv"></span></div>
    </div>
  </div>
  <div class="bb">
    <div class="bb-hdr">Office Internal Use Only</div>
    <div class="bb-body" style="min-height:52px;padding:4px 5px">
      <div class="sr"><span class="sl">Status / Processing Notes</span><span>:</span></div>
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
