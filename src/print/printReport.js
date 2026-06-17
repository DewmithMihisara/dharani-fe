// A4 portrait print for the Reports tab. Receives already-fetched data (no re-fetch)
// — the report endpoint is a POST with filters and ReportsPage already holds the data.

export function printReport(reportType, rows, meta, totalSales) {
  const fmt = n => (n != null && n !== '') ? Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
  const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

  const title = reportType === 'detail' ? 'Detail Report' : 'Summary Report'

  const metaRows = [
    ['Company',    meta.company],
    ['Project',    meta.project],
    ['Status',     meta.status],
    ['Start Date', meta.startDate],
    ['End Date',   meta.endDate],
  ].map(([k, v]) =>
    `<div class="mr"><span class="ml">${esc(k)}</span><span>:</span><span class="mv">${esc(v)}</span></div>`
  ).join('')

  const itemRows = (rows || []).map((r, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td>${esc(r.empNo)}</td>
      <td>${esc(r.empName)}</td>
      <td>${esc(r.item)}</td>
      <td>${esc(r.model)}</td>
      <td class="r">${fmt(r.sellingPrice)}</td>
      <td class="r">${fmt(r.totalPrice)}</td>
    </tr>`).join('')

  const detailTable = `
    <table class="items">
      <thead>
        <tr>
          <th style="width:32px">#</th>
          <th style="width:90px">Emp No</th>
          <th>Emp Name</th>
          <th>Item</th>
          <th>Model</th>
          <th style="width:100px">Selling Price</th>
          <th style="width:100px">Total Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="7" class="c" style="padding:10px">No records found.</td></tr>'}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="6" class="r"><strong>Total Sales (LKR)</strong></td>
          <td class="r"><strong>${fmt(totalSales)}</strong></td>
        </tr>
      </tfoot>
    </table>`

  const summaryBlock = `
    <div class="total-box">
      <span class="total-lbl">Total Sales (LKR)</span>
      <span class="total-val">${fmt(totalSales)}</span>
    </div>`

  const body = reportType === 'detail' ? detailTable : summaryBlock

  const printedAt = new Date().toLocaleString('en-LK')

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;color:#000}
body{font-family:'Times New Roman',Times,serif;font-size:12px;color:#000;width:210mm;margin:0 auto;padding:10mm 12mm}
@media print{@page{size:A4 portrait;margin:14mm}body{width:auto;padding:0}}

.hdr{display:flex;justify-content:space-between;align-items:flex-end;
     margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid #000}
.hdr-co{font-size:17px;font-weight:bold;letter-spacing:0.3px}
.hdr-right{font-size:14px;font-weight:bold;text-align:right}

.doc-title{text-align:center;font-size:14px;font-weight:bold;letter-spacing:3px;
           padding:3px 0;margin-bottom:8px;text-transform:uppercase}

.meta-box{border:1px solid #000;border-radius:4px;padding:6px 10px;margin-bottom:10px}
.mr{display:grid;grid-template-columns:110px 10px 1fr;align-items:baseline;line-height:1.7;font-size:12px}
.ml{font-weight:bold}

table.items{width:100%;border-collapse:collapse}
table.items th{background:#f0f0f0;font-weight:bold;border:1px solid #000;padding:4px 6px;text-align:left}
table.items td{border:1px solid #000;padding:3px 6px;vertical-align:top}
table.items tfoot td{border:1px solid #000;padding:5px 6px;font-size:13px}
.r{text-align:right}
.c{text-align:center}
table.items thead{display:table-header-group}

.total-box{display:flex;justify-content:space-between;align-items:center;
           border:2px solid #000;border-radius:4px;padding:14px 18px;margin-top:4px}
.total-lbl{font-size:15px;font-weight:bold;letter-spacing:1px}
.total-val{font-size:18px;font-weight:bold}

.foot{margin-top:14px;padding-top:6px;border-top:1px solid #000;
      display:flex;justify-content:space-between;font-size:9.5px;color:#000}
</style></head><body>

<div class="hdr">
  <div class="hdr-co">DHARANI CEYLON FURNITURES (Pvt.) Ltd</div>
  <div class="hdr-right">${esc(title)}</div>
</div>

<div class="meta-box">${metaRows}</div>

${body}

<div class="foot">
  <span>Generated: ${esc(printedAt)}</span>
  <span>www.dharaniceylon.lk &nbsp;|&nbsp; info@dharaniceylon.lk</span>
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
