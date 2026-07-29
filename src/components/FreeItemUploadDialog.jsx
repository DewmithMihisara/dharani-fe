import { useState } from 'react'
import ExcelJS from 'exceljs'
import { X, Upload, FileSpreadsheet, FileUp, Check, XCircle, Loader2 } from 'lucide-react'
import Button from './Button'
import ProjectPicker from './ProjectPicker'
import { uploadFreeItemBadge } from '../api/freeItemApi'

// Expected header row (row 2), in order. Compared after whitespace-collapse + lowercase.
const DISPLAY_HEADERS = [
  'Product Category', 'Item', 'Model', 'Size', 'Name',
  'Price', 'Supplier Name', 'Supplier Address', 'Supplier Contact No',
]
const EXPECTED_HEADERS = DISPLAY_HEADERS.map(normalize)

function normalize(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

// Unwrap an ExcelJS cell value (string | number | { result } | { richText } | { text }).
function cellRaw(row, col) {
  const v = row.getCell(col).value
  if (v == null) return null
  if (typeof v === 'object') {
    if ('result' in v) return v.result
    if ('text' in v) return v.text
    if ('richText' in v) return v.richText.map(r => r.text).join('')
  }
  return v
}
function cellText(row, col) {
  const v = cellRaw(row, col)
  return v == null ? '' : String(v).trim()
}
function cellNum(row, col) {
  const v = cellRaw(row, col)
  if (v == null || v === '') return 0
  const n = Number(String(v).replace(/,/g, '').replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

const EMPTY_CTX = { companyId: null, companyName: '', branchId: null, branchName: '', projectId: null, projectName: '' }

function StepRow({ status, label, children }) {
  const icon =
    status === 'pass'    ? <Check size={16} className="text-green-600" />
    : status === 'fail'  ? <XCircle size={16} className="text-red-500" />
    : status === 'running' ? <Loader2 size={16} className="text-[#14213d] animate-spin" />
    : <span className="block w-3.5 h-3.5 rounded-full border-2 border-[#d8d8d8]" />
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#f0f0f0] last:border-0">
      <span className="mt-0.5 shrink-0 w-4 flex justify-center">{icon}</span>
      <div className="flex flex-col gap-1 min-w-0">
        <span className={`text-sm ${status === 'fail' ? 'text-red-600' : status === 'pass' ? 'text-[#222]' : 'text-[#666]'}`}>{label}</span>
        {children}
      </div>
    </div>
  )
}

export default function FreeItemUploadDialog({ onClose, onUploaded }) {
  const [ctx, setCtx] = useState(EMPTY_CTX)
  const [file, setFile] = useState(null)
  const [phase, setPhase] = useState('form') // 'form' | 'checklist'
  const [checks, setChecks] = useState({ fileType: 'idle', columns: 'idle', save: 'idle' })
  const [colErrors, setColErrors] = useState([])
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { badgeId, badgeNumber, itemsAdded }

  const token = localStorage.getItem('accessToken')
  const canUpload = !!ctx.projectId && !!file
  const succeeded = checks.save === 'pass' && !!result

  async function handleUpload() {
    setPhase('checklist')
    setError('')
    setColErrors([])
    setResult(null)
    setChecks({ fileType: 'running', columns: 'idle', save: 'idle' })

    // 1 — File type
    if (!/\.xlsx$/i.test(file.name)) {
      setChecks(c => ({ ...c, fileType: 'fail' }))
      setError('The file must be an Excel .xlsx file.')
      return
    }
    let ws
    try {
      const buf = await file.arrayBuffer()
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(buf)
      ws = wb.worksheets[0]
      if (!ws) throw new Error('no worksheet')
    } catch {
      setChecks(c => ({ ...c, fileType: 'fail' }))
      setError('Could not read the file as a valid .xlsx workbook.')
      return
    }
    setChecks(c => ({ ...c, fileType: 'pass', columns: 'running' }))

    // 2 — Columns (header row is row 2; row 1 is ignored)
    const headerRow = ws.getRow(2)
    const mismatches = []
    EXPECTED_HEADERS.forEach((exp, i) => {
      if (normalize(cellRaw(headerRow, i + 1)) !== exp) {
        const found = cellText(headerRow, i + 1) || '(empty)'
        mismatches.push(`Column ${i + 1}: expected "${DISPLAY_HEADERS[i]}", found "${found}"`)
      }
    })
    if (mismatches.length) {
      setChecks(c => ({ ...c, columns: 'fail' }))
      setColErrors(mismatches)
      return
    }
    setChecks(c => ({ ...c, columns: 'pass', save: 'running' }))

    // 3 — Build items (data starts row 3) and save
    const items = []
    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return
      const productCategory = cellText(row, 1)
      const item = cellText(row, 2)
      const model = cellText(row, 3)
      const size = cellText(row, 4)
      const supplierName = cellText(row, 7)
      if (!productCategory || !item || !model || !size || !supplierName) return // skip empty / incomplete rows
      items.push({
        id: null,
        freeItemId: null,
        productCategory,
        item,
        model,
        size,
        name: cellText(row, 5) || null,
        price: cellNum(row, 6),
        supplierId: null,
        supplierName,
        supplierAddress: cellText(row, 8),
        supplierContactNo: cellText(row, 9),
      })
    })

    if (!items.length) {
      setChecks(c => ({ ...c, save: 'fail' }))
      setError('No data rows found. Items must start on row 3, below the header row.')
      return
    }

    try {
      const res = await uploadFreeItemBadge({ projectId: ctx.projectId, items }, token)
      if (res.status === 200) {
        setChecks(c => ({ ...c, save: 'pass' }))
        setResult({ badgeId: res.data.badgeId, badgeNumber: res.data.badgeNumber, itemsAdded: res.data.itemsAdded })
      } else {
        setChecks(c => ({ ...c, save: 'fail' }))
        setError(res.message || 'Upload failed.')
      }
    } catch (e) {
      setChecks(c => ({ ...c, save: 'fail' }))
      setError(e.message || 'Upload failed.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">

          {/* Header */}
          <div className="bg-[#14213d] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet size={18} className="text-[#fca311]" />
              <span className="text-white font-semibold text-sm">Upload Free Item Badge by Excel</span>
            </div>
            <button onClick={onClose} className="text-[#6b7a99] hover:text-white transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto flex flex-col gap-5">
            {phase === 'form' ? (
              <>
                {/* Destination */}
                <div>
                  <p className="text-xs font-semibold text-[#555] mb-2">Destination</p>
                  <ProjectPicker value={ctx} onChange={setCtx} excludeEndedProjects />
                </div>

                {/* File browse */}
                <div>
                  <p className="text-xs font-semibold text-[#555] mb-2">Excel File</p>
                  <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-[#cbd5e1] bg-[#fafafa] cursor-pointer hover:border-[#14213d] transition-colors">
                    <FileUp size={18} className="text-[#14213d] shrink-0" />
                    <span className={`text-sm truncate ${file ? 'text-[#222]' : 'text-[#999]'}`}>
                      {file ? file.name : 'Browse for an .xlsx file…'}
                    </span>
                    <input
                      type="file"
                      accept=".xlsx"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                {/* Instructions */}
                <div className="rounded-lg bg-[#f6f8fc] border border-[#e3e9f3] p-4 text-xs text-[#555] leading-relaxed">
                  <p className="font-semibold text-[#14213d] mb-1.5">Instructions</p>
                  <ul className="list-disc pl-4 flex flex-col gap-1">
                    <li>Supported file type: <span className="font-semibold">.xlsx</span> only.</li>
                    <li>The <span className="font-semibold">first row is ignored</span>. Column headers must be on the <span className="font-semibold">second row</span>; data starts on the third row.</li>
                    <li>Do not leave empty rows between items.</li>
                    <li>Suppliers are matched by name (created automatically if new) — check spelling.</li>
                    <li>Required columns, in this exact order:</li>
                  </ul>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {DISPLAY_HEADERS.map((h, i) => (
                      <span key={h} className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-[#dde4f0] text-[10px] text-[#444]">
                        {i + 1}. {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <Button type="button" disabled={!canUpload} onClick={handleUpload}>
                    <Upload size={14} className="mr-1.5" />
                    Upload
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Checklist */}
                <div className="rounded-lg border border-[#e5e5e5] px-4 py-1">
                  <StepRow status={checks.fileType} label="File type is correct (.xlsx)" />
                  <StepRow status={checks.columns} label="All columns are placed correctly">
                    {colErrors.length > 0 && (
                      <ul className="list-disc pl-4 text-xs text-red-500 flex flex-col gap-0.5 mt-1">
                        {colErrors.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    )}
                  </StepRow>
                  <StepRow
                    status={checks.save}
                    label={
                      succeeded
                        ? `${result.itemsAdded} item${result.itemsAdded !== 1 ? 's' : ''} added to badge ${result.badgeNumber}.`
                        : 'Items added to the badge'
                    }
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <div className="flex justify-end gap-2">
                  <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] transition-colors cursor-pointer">
                    Close
                  </button>
                  {succeeded && (
                    <Button type="button" onClick={() => onUploaded({ id: result.badgeId, freeItemBadgeNumber: result.badgeNumber, status: 'PENDING' })}>
                      View Badge
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
