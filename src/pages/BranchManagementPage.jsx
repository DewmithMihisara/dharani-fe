import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import { getCompanyOptions } from '../api/companyApi'
import {
  getBranchesPaginated,
  saveBranch,
  getBranchDeleteSummary,
  deleteBranch,
} from '../api/branchApi'

function PaginationBar({ offset, limit, total, onLimitChange, onPrev, onNext }) {
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1
  const pages = limit > 0 ? Math.ceil(total / limit) : 1

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e5e5] bg-white text-xs text-[#666]">
      <span>{total > 0 ? `Showing ${from}–${to} of ${total} branches` : 'No branches found'}</span>
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

function BranchesTable({ branches, onEdit, onDelete }) {
  return (
    <div className="w-full overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#14213d] text-white text-left">
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Company Name</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Branch Name</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Branch Code</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Active Projects</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {branches.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[#999]">No branches found</td>
            </tr>
          )}
          {branches.map((b, i) => (
            <tr
              key={b.id}
              className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
              }`}
            >
              <td className="px-5 py-3.5 text-[#555]">{b.companyName}</td>
              <td className="px-5 py-3.5 font-semibold text-[#14213d]">{b.name}</td>
              <td className="px-5 py-3.5 text-[#555]">{b.branchCode}</td>
              <td className="px-5 py-3.5 text-[#666]">{b.activeProjectCount}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(b)}
                    title="Edit"
                    className="p-1.5 rounded-md text-[#14213d] hover:bg-[#14213d] hover:text-white transition-colors duration-100 cursor-pointer"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(b)}
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

function BranchFormModal({ branch, onClose, onSaved }) {
  const isEdit = !!branch
  const [companyId, setCompanyId] = useState(branch?.companyId ? String(branch.companyId) : '')
  const [branchCode, setBranchCode] = useState(branch?.branchCode ?? '')
  const [name, setName] = useState(branch?.name ?? '')
  const [companyOptions, setCompanyOptions] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const res = await getCompanyOptions(token)
      if (res.status === 200) {
        setCompanyOptions((res.data.companies ?? []).map(c => ({ value: String(c.id), label: c.name })))
      }
    }
    load()
  }, [])

  async function handleSave() {
    if (!companyId || !branchCode.trim() || !name.trim()) {
      setError('Company, Branch Code and Name are all required.')
      return
    }
    setSaving(true)
    setError('')
    const token = localStorage.getItem('accessToken')
    const res = await saveBranch(
      { id: branch?.id ?? null, companyId: Number(companyId), name: name.trim(), branchCode: branchCode.trim() },
      token,
    )
    setSaving(false)
    if (res.status === 200) {
      onSaved()
    } else {
      setError(res.message || 'Failed to save branch.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg w-96 overflow-hidden">
        <div className="flex items-center justify-between bg-[#14213d] px-5 py-4">
          <h2 className="text-white font-semibold text-sm">{isEdit ? 'Edit Branch' : 'Create Branch'}</h2>
          <button onClick={onClose} className="text-[#6b7a99] hover:text-white transition-colors duration-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <Select
            label="Company"
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            options={companyOptions}
            placeholder="Select a company…"
            required
          />
          <Input
            label="Branch Code"
            value={branchCode}
            onChange={e => setBranchCode(e.target.value)}
            placeholder="e.g. MAS_SLIMLINE"
            required
          />
          <Input
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. MAS Slimline"
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

function BranchDeleteDialog({ branch, onClose, onDeleted }) {
  const [summary, setSummary] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const requiredText = `Delete ${branch.branchCode}`
  const matches = confirmText === requiredText

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const res = await getBranchDeleteSummary(branch.id, token)
      if (res.status === 200) setSummary(res.data.summary)
    }
    load()
  }, [branch.id])

  async function handleDelete() {
    if (!matches) {
      setError(`Type exactly: ${requiredText}`)
      return
    }
    setDeleting(true)
    setError('')
    const token = localStorage.getItem('accessToken')
    const res = await deleteBranch(branch.id, token)
    setDeleting(false)
    if (res.status === 200) {
      onDeleted()
    } else {
      setError(res.message || 'Failed to delete branch.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg w-[28rem] overflow-hidden">
        <div className="flex items-center justify-between bg-red-600 px-5 py-4">
          <h2 className="text-white font-semibold text-sm">Delete Branch</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors duration-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-[#222] leading-relaxed">
            Deleting <span className="font-semibold text-[#14213d]">{branch.name}</span> will also delete{' '}
            {summary ? (
              <>
                <span className="font-semibold">{summary.projectCount}</span> project(s) and{' '}
                <span className="font-semibold">{summary.orderCount}</span> order(s)
              </>
            ) : (
              'all related projects and orders'
            )}{' '}
            — along with all their customers and orders data.
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

export default function BranchManagementPage({ onDataChange }) {
  const [branches, setBranches] = useState([])
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
      const res = await getBranchesPaginated({ offset, limit }, token)
      if (res.status === 200) {
        setBranches(res.data.branches)
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
        <h1 className="text-2xl font-semibold text-[#14213d]">Branches</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} className="mr-1.5" />
          Create Branch
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-hidden">
        <BranchesTable
          branches={branches}
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
        <BranchFormModal
          branch={null}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); refresh() }}
        />
      )}

      {editTarget && (
        <BranchFormModal
          branch={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); refresh() }}
        />
      )}

      {deleteTarget && (
        <BranchDeleteDialog
          branch={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refresh() }}
        />
      )}
    </div>
  )
}
