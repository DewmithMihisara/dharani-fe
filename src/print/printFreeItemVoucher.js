export function printFreeItemVoucher(data) {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const printedAt = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}  ${pad(now.getHours())}:${pad(now.getMinutes())}`

  const MIN_ROWS = 3
  const rows = data.rows || []

  const dash = v => (v != null && String(v).trim() !== '') ? v : '-'
  const itemRows = rows.map((r, idx) => `
    <tr>
      <td class="num">${idx + 1}</td>
      <td>${dash(r.productCategory)}</td>
      <td>${dash(r.item)}</td>
      <td>${dash(r.model)}</td>
      <td>${dash(r.size)}</td>
      <td>${dash(r.name)}</td>
      <td class="c">${r.qty || 1}</td>
      <td class="r">${r.price != null ? Number(r.price).toLocaleString('en-LK') : '-'}</td>
      <td class="r">${r.totalPrice != null ? Number(r.totalPrice).toLocaleString('en-LK') : '-'}</td>
    </tr>`).join('')

  const emptyRows = Array(Math.max(0, MIN_ROWS - rows.length)).fill(
    '<tr><td class="num">&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
  ).join('')

  const voucherHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Payment Voucher</title>
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

.info-grid{display:grid;grid-template-columns:1fr;gap:4px;margin-bottom:2px}
.info-box{border:1px solid #000;border-radius:4px;padding:2px 8px;display:grid;grid-template-columns:1fr 1fr;column-gap:12px}
.info-col{display:flex;flex-direction:column}
.cr{display:grid;grid-template-columns:120px 9px 1fr;align-items:baseline;line-height:1.65;font-size:12px}
.cv{}
.pm{display:flex;align-items:center;gap:10px;line-height:1.65;font-size:12px}
.pm-lbl{width:120px}
.pm-item{display:flex;align-items:center;gap:5px}
.chk{display:inline-block;width:9px;height:9px;border:1px solid #000}

table.items{width:100%;border-collapse:collapse;flex-shrink:0}
table.items th{background:#fff;color:#000;font-weight:bold;border:1px solid #000;padding:2px 4px;text-align:center}
table.items tbody td, table.items tfoot td{border-left:1px solid #000;border-right:1px solid #000;padding:2px 4px;vertical-align:middle;height:14px}
table.items tbody tr:first-child td{border-top:1px solid #000}
table.items tbody tr:last-child td{border-bottom:1px solid #000}
table.items tfoot td{border-top:2px solid #000;border-bottom:1px solid #000;font-weight:bold}
.num{text-align:center;width:16px}
.c{text-align:center}.r{text-align:right}

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
    <strong>Project&nbsp;:</strong>&nbsp;${data.projectCode || ''}
  </div>
</div>

<div class="doc-title">
  P A Y M E N T &nbsp; V O U C H E R
</div>

<div class="info-grid">
  <div class="info-box">
    <div class="info-col">
      <div class="cr"><span>Supplier Name</span><span>:</span><span class="cv">${data.supplierName || ''}</span></div>
      <div class="cr"><span>Address</span><span>:</span><span class="cv">${data.supplierAddress || ''}</span></div>
      <div class="cr"><span>Printed</span><span>:</span><span class="cv">${printedAt}</span></div>
    </div>
    <div class="info-col">
      <div class="cr"><span>Project</span><span>:</span><span class="cv">${data.projectCode || ''}</span></div>
      <div class="cr"><span>Contact No.</span><span>:</span><span class="cv">${data.supplierContactNo || ''}</span></div>
      <div class="pm">
        <span class="pm-lbl">Payment Method</span>
        <span class="pm-item"><span class="chk"></span>Card</span>
        <span class="pm-item"><span class="chk"></span>Cash</span>
      </div>
    </div>
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th class="num">#</th>
      <th style="width:14%">Category</th>
      <th style="width:14%">Item</th>
      <th style="width:14%">Model</th>
      <th style="width:10%">Size</th>
      <th style="width:14%">Name</th>
      <th class="c" style="width:22px">Qty</th>
      <th class="r" style="width:11%">Price</th>
      <th class="r" style="width:11%">Total</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
    ${emptyRows}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="8" class="r">Total Price (LKR)</td>
      <td class="r">${data.grandTotal != null ? Number(data.grandTotal).toLocaleString('en-LK') : '0.00'}</td>
    </tr>
  </tfoot>
</table>

<div class="bot">
  <div class="bb">
    <div class="bb-hdr">Checked By</div>
    <div class="bb-body" style="padding-top:36px">
      <div class="sr"><span class="sl">Authorized Signature</span><span>:</span><span class="sv"></span></div>
    </div>
  </div>
  <div class="bb">
    <div class="bb-hdr">Approved By</div>
    <div class="bb-body" style="padding-top:36px">
      <div class="sr"><span class="sl">Authorized Signature</span><span>:</span><span class="sv"></span></div>
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
  const voucherIframe = document.createElement('iframe')
  voucherIframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0'
  document.body.appendChild(voucherIframe)
  voucherIframe.onload = () => {
    voucherIframe.contentWindow.focus()
    voucherIframe.contentWindow.print()
    voucherIframe.contentWindow.addEventListener('afterprint', () => voucherIframe.remove(), { once: true })
  }
  voucherIframe.contentDocument.open()
  voucherIframe.contentDocument.write(voucherHtml)
  voucherIframe.contentDocument.close()
}
