import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import {
  getCompaniesPaginated,
  saveCompany,
  getCompanyDeleteSummary,
  deleteCompany,
} from '../api/companyApi'

function PaginationBar({ offset, limit, total, onLimitChange, onPrev, onNext }) {
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1
  const pages = limit > 0 ? Math.ceil(total / limit) : 1

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e5e5] bg-white text-xs text-[#666]">
      <span>{total > 0 ? `Showing ${from}–${to} of ${total} companies` : 'No companies found'}</span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[#aaa]">Rows per page:</span>
          <select
            value={limit}
            onChange={e => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 rounded-md border border-[#e5e5e5] bg-white text-xs text-[#333] focus:outline-none focus:border-[#14213d] cursor-pointer"
          >
            {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={offset === 0}
            className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            ←
          </button>
          <span className="text-[#444] font-medium">Page {page} of {pages}</span>
          <button
            onClick={onNext}
            disabled={offset + limit >= total}
            className="px-2 py-1 rounded-md border border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

function CompaniesTable({ companies, onEdit, onDelete }) {
  return (
    <div className="w-full overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#14213d] text-white text-left">
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Name</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Company Code</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Active Branches</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Active Projects</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[#999]">No companies found</td>
            </tr>
          )}
          {companies.map((c, i) => (
            <tr
              key={c.id}
              className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
              }`}
            >
              <td className="px-5 py-3.5 font-semibold text-[#14213d]">{c.name}</td>
              <td className="px-5 py-3.5 text-[#555]">{c.companyCode}</td>
              <td className="px-5 py-3.5 text-[#666]">{c.activeBranchCount}</td>
              <td className="px-5 py-3.5 text-[#666]">{c.activeProjectCount}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(c)}
                    title="Edit"
                    className="p-1.5 rounded-md text-[#14213d] hover:bg-[#14213d] hover:text-white transition-colors duration-100 cursor-pointer"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(c)}
                    title="Delete"
                    className="p-1.5 rounded-md text-red-600 hover:bg-red-600 hover:text-white transition-colors duration-100 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompanyFormModal({ company, onClose, onSaved }) {
  const isEdit = !!company
  const [companyCode, setCompanyCode] = useState(company?.companyCode ?? '')
  const [name, setName] = useState(company?.name ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!companyCode.trim() || !name.trim()) {
      setError('Company Code and Name are required.')
      return
    }
    setSaving(true)
    setError('')
    const token = localStorage.getItem('accessToken')
    const res = await saveCompany(
      { id: company?.id ?? null, name: name.trim(), companyCode: companyCode.trim() },
      token,
    )
    setSaving(false)
    if (res.status === 200) {
      onSaved()
    } else {
      setError(res.message || 'Failed to save company.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg w-96 overflow-hidden">
        <div className="flex items-center justify-between bg-[#14213d] px-5 py-4">
          <h2 className="text-white font-semibold text-sm">{isEdit ? 'Edit Company' : 'Create Company'}</h2>
          <button onClick={onClose} className="text-[#6b7a99] hover:text-white transition-colors duration-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <Input
            label="Company Code"
            value={companyCode}
            onChange={e => setCompanyCode(e.target.value)}
            placeholder="e.g. MAS"
            required
          />
          <Input
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. MAS Holdings"
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#e5e5e5]">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </div>
  )
}

function CompanyDeleteDialog({ company, onClose, onDeleted }) {
  const [summary, setSummary] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const requiredText = `Delete ${company.companyCode}`
  const matches = confirmText === requiredText

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const res = await getCompanyDeleteSummary(company.id, token)
      if (res.status === 200) setSummary(res.data.summary)
    }
    load()
  }, [company.id])

  async function handleDelete() {
    if (!matches) {
      setError(`Type exactly: ${requiredText}`)
      return
    }
    setDeleting(true)
    setError('')
    const token = localStorage.getItem('accessToken')
    const res = await deleteCompany(company.id, token)
    setDeleting(false)
    if (res.status === 200) {
      onDeleted()
    } else {
      setError(res.message || 'Failed to delete company.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg w-[28rem] overflow-hidden">
        <div className="flex items-center justify-between bg-red-600 px-5 py-4">
          <h2 className="text-white font-semibold text-sm">Delete Company</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors duration-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-[#222] leading-relaxed">
            Deleting <span className="font-semibold text-[#14213d]">{company.name}</span> will also delete{' '}
            {summary ? (
              <>
                <span className="font-semibold">{summary.branchCount}</span> branch(es),{' '}
                <span className="font-semibold">{summary.projectCount}</span> project(s) and{' '}
                <span className="font-semibold">{summary.orderCount}</span> order(s)
              </>
            ) : (
              'all related branches, projects and orders'
            )}{' '}
            (along with their employees, guarantors and items).
          </p>
          <p className="text-xs text-red-500 font-medium">This data cannot be recovered.</p>
          <Input
            label={`Type "${requiredText}" to confirm`}
            value={confirmText}
            onChange={e => { setConfirmText(e.target.value); setError('') }}
            placeholder={requiredText}
            error={error}
          />
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#e5e5e5]">
          <Button variant="secondary" onClick={onClose} disabled={deleting}>Cancel</Button>
          <button
            onClick={handleDelete}
            disabled={!matches || deleting}
            className="inline-flex items-center justify-center py-2 px-5 rounded-lg text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CompanyManagementPage({ onDataChange }) {
  const [companies, setCompanies] = useState([])
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const res = await getCompaniesPaginated({ offset, limit }, token)
      if (res.status === 200) {
        setCompanies(res.data.companies)
        setTotal(Number(res.data.total))
      }
    }
    load()
  }, [offset, limit, refreshKey])

  function handleLimitChange(newLimit) {
    setLimit(newLimit)
    setOffset(0)
  }

  function handlePrev() {
    setOffset(prev => Math.max(0, prev - limit))
  }

  function handleNext() {
    setOffset(prev => (prev + limit < total ? prev + limit : prev))
  }

  function refresh() {
    setRefreshKey(k => k + 1)
    onDataChange?.()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#14213d]">Companies</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} className="mr-1.5" />
          Create Company
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-hidden">
        <CompaniesTable
          companies={companies}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
        <PaginationBar
          offset={offset}
          limit={limit}
          total={total}
          onLimitChange={handleLimitChange}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </div>

      {createOpen && (
        <CompanyFormModal
          company={null}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); refresh() }}
        />
      )}

      {editTarget && (
        <CompanyFormModal
          company={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); refresh() }}
        />
      )}

      {deleteTarget && (
        <CompanyDeleteDialog
          company={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refresh() }}
        />
      )}
    </div>
  )
}
