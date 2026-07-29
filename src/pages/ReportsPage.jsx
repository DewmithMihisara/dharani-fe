import { useState, useEffect } from 'react'
import { FileSpreadsheet, FileBarChart, Download, Printer } from 'lucide-react'
import ExcelJS from 'exceljs'
import Button from '../components/Button'
import Combobox from '../components/Combobox'
import { getBranches, getProjectsByBranch, getReportData } from '../api/orderApi'
import { printReport } from '../print/printReport'

const STATUS_OPTIONS = [
  { value: 'APPROVAL_PROCESSING', label: 'Approval Processing' },
  { value: 'APPROVED',            label: 'Approved'            },
  { value: 'NOT_APPROVED',        label: 'Not Approved'        },
  { value: 'IN_PRODUCTION',       label: 'In Production'       },
  { value: 'ON_DELIVERY',         label: 'On Delivery'         },
  { value: 'DELIVERED',           label: 'Delivered'           },
  { value: 'CANCELED',            label: 'Cancelled'           },
]
const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]))

// Groups consecutive rows that belong to the same customer (same order) so Emp No / Emp Name / #
// can be rendered/merged once per group instead of once per item row.
function annotateCustomerGroups(rows) {
  const out = []
  let seq = 0
  let groupStartIdx = -1
  for (const r of rows) {
    const prev = out[out.length - 1]
    const sameCustomer = prev && prev.empNo === r.empNo && prev.empName === r.empName
    if (sameCustomer) {
      out[groupStartIdx]._groupSize++
      out.push({ ...r, _groupStart: false, _groupSeq: seq })
    } else {
      seq++
      groupStartIdx = out.length
      out.push({ ...r, _groupStart: true, _groupSeq: seq, _groupSize: 1 })
    }
  }
  return out
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white text-xs text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100'
const disabledSelectCls = 'w-full px-3 py-2 rounded-lg border border-[#e5e5e5] bg-[#fafafa] text-xs text-[#bbb] cursor-not-allowed'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('detail') // 'detail' | 'summary'
  const [priceBasis, setPriceBasis] = useState('SELLING') // 'SELLING' | 'TRANSFER'

  const [branches, setBranches]               = useState([])
  const [branchProjects, setBranchProjects]   = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState(null)

  const [companyName, setCompanyName] = useState('')
  const [projectId,   setProjectId]   = useState('')
  const [status,      setStatus]      = useState('')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')

  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    getBranches(token).then(res => setBranches(res.data?.branches ?? []))
  }, [])

  useEffect(() => {
    if (selectedBranchId == null) { setBranchProjects([]); return }
    const token = localStorage.getItem('accessToken')
    getProjectsByBranch(selectedBranchId, token).then(res =>
      setBranchProjects(res.data?.projects ?? [])
    )
  }, [selectedBranchId])

  const canGenerate = Boolean(projectId) && Boolean(status) && !generating

  // Fetch + normalize the report data. Returns { rows, meta, totalSales } or null on error.
  async function fetchReport() {
    const token = localStorage.getItem('accessToken')
    const res = await getReportData({
      projectId: Number(projectId),
      status,
      startDate: startDate || null,
      endDate:   endDate   || null,
      useTransferPrice: priceBasis === 'TRANSFER',
    }, token)

    if (res.status !== 200) {
      setError(res.message || 'Failed to generate report.')
      return null
    }

    const rows = annotateCustomerGroups(res.data.rows || [])
    const meta = {
      company:   res.data.company   || companyName,
      project:   res.data.project   || '',
      status:    STATUS_LABELS[res.data.status] || res.data.status || '',
      startDate: res.data.startDate || 'All',
      endDate:   res.data.endDate   || 'All',
    }
    const totalSales = rows.reduce((sum, r) => sum + Number(r.totalPrice || 0), 0)
    return { rows, meta, totalSales }
  }

  async function handleGenerate(format) {
    setError('')
    setGenerating(true)
    try {
      const data = await fetchReport()
      if (!data) return
      const priceLabel = priceBasis === 'TRANSFER' ? 'Transfer Price' : 'Selling Price'
      if (format === 'print') {
        printReport(reportType, data.rows, data.meta, data.totalSales, priceLabel)
      } else {
        await buildAndSaveWorkbook(reportType, data.rows, data.meta, data.totalSales, priceLabel)
      }
    } catch (e) {
      setError(e.message || 'Failed to generate report.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#14213d] mb-6">Reports</h1>

      {/* Report type selector */}
      <div className="grid grid-cols-2 gap-3 max-w-2xl mb-6">
        <ReportTypeCard
          active={reportType === 'detail'}
          icon={FileSpreadsheet}
          title="Detail Report"
          desc="One row per item, with a Total Sales row at the bottom."
          onClick={() => setReportType('detail')}
        />
        <ReportTypeCard
          active={reportType === 'summary'}
          icon={FileBarChart}
          title="Summary Report"
          desc="Only the Total Sales figure for the selected filters."
          onClick={() => setReportType('summary')}
        />
      </div>

      {/* Price basis selector */}
      <div className="grid grid-cols-2 gap-3 max-w-2xl mb-6">
        <ReportTypeCard
          active={priceBasis === 'SELLING'}
          icon={FileSpreadsheet}
          title="Selling Price"
          desc="Price each item at the customer-facing selling price."
          onClick={() => setPriceBasis('SELLING')}
        />
        <ReportTypeCard
          active={priceBasis === 'TRANSFER'}
          icon={FileBarChart}
          title="Transfer Price"
          desc="Price each item at the internal transfer price instead."
          onClick={() => setPriceBasis('TRANSFER')}
        />
      </div>

      {/* Filter form */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e5e5e5] p-6 max-w-2xl flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#222]">Company<span className="text-[#fca311] ml-0.5">*</span></label>
            <Combobox
              value={companyName}
              options={branches.map(b => ({ id: b.id, label: b.name }))}
              onChange={(label, id) => {
                setCompanyName(label)
                setProjectId('')
                setSelectedBranchId(id)
              }}
              placeholder="Search company…"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#222]">Project<span className="text-[#fca311] ml-0.5">*</span></label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              disabled={!companyName}
              className={!companyName ? disabledSelectCls : `${inputCls} cursor-pointer`}
            >
              <option value="">Select project…</option>
              {branchProjects.map(p => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#222]">Status<span className="text-[#fca311] ml-0.5">*</span></label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">Select status…</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#222]">Start Date</label>
              <input type="date" value={startDate} max={endDate || undefined}
                onChange={e => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#222]">End Date</label>
              <input type="date" value={endDate} min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[#999]">Date range is optional. A save dialog will open so you can choose where to save the Excel file.</p>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleGenerate('print')} disabled={!canGenerate}>
            <Printer size={14} className="mr-1.5" />
            {generating ? 'Generating…' : 'Generate Print'}
          </Button>
          <Button onClick={() => handleGenerate('excel')} disabled={!canGenerate}>
            <Download size={14} className="mr-1.5" />
            {generating ? 'Generating…' : 'Generate Excel'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ReportTypeCard({ active, icon: Icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-colors duration-150 cursor-pointer ${
        active
          ? 'border-[#fca311] bg-[#fca311]/10'
          : 'border-[#e5e5e5] bg-white hover:border-[#fca311]/60'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={18} strokeWidth={1.8} className="text-[#14213d]" />
        <span className="text-sm font-semibold text-[#14213d]">{title}</span>
      </div>
      <p className="text-[11px] text-[#777]">{desc}</p>
    </button>
  )
}

const MONEY_FMT = '#,##0.00'

async function buildAndSaveWorkbook(reportType, rows, meta, totalSales, priceLabel = 'Selling Price') {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(reportType === 'detail' ? 'Detail Report' : 'Summary Report')
  ws.columns = [{ width: 16 }, { width: 28 }, { width: 22 }, { width: 22 }, { width: 16 }, { width: 16 }]

  // Header block
  const headerPairs = [
    ['Company',    meta.company],
    ['Project',    meta.project],
    ['Status',     meta.status],
    ['Start Date', meta.startDate],
    ['End Date',   meta.endDate],
  ]
  headerPairs.forEach(([k, v]) => {
    const row = ws.addRow([k, v])
    row.getCell(1).font = { bold: true }
  })
  ws.addRow([]) // spacer

  if (reportType === 'detail') {
    const headerRow = ws.addRow(['Emp No', 'Emp Name', 'Item', 'Model', priceLabel, 'Total Price'])
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
      cell.font = { bold: true }
    })

    const dataStartRow = ws.rowCount + 1
    rows.forEach(r => {
      const row = ws.addRow([
        r._groupStart ? (r.empNo || '') : '',
        r._groupStart ? (r.empName || '') : '',
        r.item || '', r.model || '',
        Number(r.sellingPrice || 0), Number(r.totalPrice || 0),
      ])
      row.getCell(5).numFmt = MONEY_FMT
      row.getCell(6).numFmt = MONEY_FMT
    })

    rows.forEach((r, idx) => {
      if (r._groupStart && r._groupSize > 1) {
        const top = dataStartRow + idx
        const bottom = top + r._groupSize - 1
        ws.mergeCells(top, 1, bottom, 1)
        ws.mergeCells(top, 2, bottom, 2)
        ws.getCell(top, 1).alignment = { vertical: 'middle' }
        ws.getCell(top, 2).alignment = { vertical: 'middle' }
      }
    })
  }

  // Total Sales row (present in both reports)
  const totalRow = ws.addRow(['', '', '', '', 'TOTAL SALES', Number(totalSales || 0)])
  totalRow.getCell(5).font = { bold: true }
  totalRow.getCell(6).font = { bold: true }
  totalRow.getCell(6).numFmt = MONEY_FMT

  const wbBuffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([wbBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const fname = (reportType === 'detail' ? 'detail-report' : 'summary-report') + '.xlsx'

  if (typeof window.showSaveFilePicker === 'function') {
    const fh = await window.showSaveFilePicker({
      suggestedName: fname,
      types: [{ description: 'Excel Files', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
    })
    const writable = await fh.createWritable()
    await writable.write(blob)
    await writable.close()
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = fname; a.click()
    URL.revokeObjectURL(url)
  }
}
