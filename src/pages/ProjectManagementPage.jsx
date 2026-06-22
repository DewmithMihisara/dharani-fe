import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Ban, AlertTriangle } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import { getCompanyOptions } from '../api/companyApi'
import { getBranchesByCompany } from '../api/orderApi'
import {
  getProjectsPaginated,
  saveProject,
  getProjectDeleteSummary,
  deleteProject,
  endProject,
} from '../api/projectApi'

function StatusPill({ status }) {
  const ended = status === 'ENDED'
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
        ended ? 'bg-[#f3d9d9] text-[#9b2c2c]' : 'bg-green-100 text-green-700'
      }`}
    >
      {status}
    </span>
  )
}

function PaginationBar({ offset, limit, total, onLimitChange, onPrev, onNext }) {
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1
  const pages = limit > 0 ? Math.ceil(total / limit) : 1

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e5e5] bg-white text-xs text-[#666]">
      <span>{total > 0 ? `Showing ${from}–${to} of ${total} projects` : 'No projects found'}</span>
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

function ProjectsTable({ projects, onEdit, onEnd, onDelete }) {
  return (
    <div className="w-full overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#14213d] text-white text-left">
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Company Name</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Branch Name</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Project Code</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Start From</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">End Date</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap">Active Orders</th>
            <th className="px-5 py-3.5 font-medium whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 && (
            <tr>
              <td colSpan={8} className="px-5 py-8 text-center text-[#999]">No projects found</td>
            </tr>
          )}
          {projects.map((p, i) => {
            const isEnded = !!p.endedIn
            return (
              <tr
                key={p.id}
                className={`border-t border-[#ebebeb] hover:bg-[#f5f5f5] transition-colors duration-100 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
                }`}
              >
                <td className="px-5 py-3.5 text-[#555]">{p.companyName}</td>
                <td className="px-5 py-3.5 text-[#555]">{p.branchName}</td>
                <td className="px-5 py-3.5 font-semibold text-[#14213d]">{p.projectCode}</td>
                <td className="px-5 py-3.5 text-[#666]">{p.startFrom}</td>
                <td className="px-5 py-3.5 text-[#666]">{p.endedIn || '—'}</td>
                <td className="px-5 py-3.5"><StatusPill status={p.status} /></td>
                <td className="px-5 py-3.5 text-[#666]">{p.activeOrderCount}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    {!isEnded && (
                      <button
                        onClick={() => onEdit(p)}
                        title="Edit"
                        className="p-1.5 rounded-md text-[#14213d] hover:bg-[#14213d] hover:text-white transition-colors duration-100 cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {!isEnded && (
                      <button
                        onClick={() => onEnd(p)}
                        title="End project"
                        className="p-1.5 rounded-md text-[#c77700] hover:bg-[#fca311] hover:text-[#14213d] transition-colors duration-100 cursor-pointer"
                      >
                        <Ban size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(p)}
                      title="Delete"
                      className="p-1.5 rounded-md text-red-600 hover:bg-red-600 hover:text-white transition-colors duration-100 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ProjectFormModal({ project, onClose, onSaved }) {
  const isEdit = !!project
  const [companyId, setCompanyId] = useState(project?.companyId ? String(project.companyId) : '')
  const [branchId, setBranchId] = useState(project?.branchId ? String(project.branchId) : '')
  const [projectCode, setProjectCode] = useState(project?.projectCode ?? '')
  const [startFrom, setStartFrom] = useState(project?.startFrom ?? '')
  const [companyOptions, setCompanyOptions] = useState([])
  const [branchOptions, setBranchOptions] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const res = await getCompanyOptions(token)
      if (res.status === 200) {
        setCompanyOptions((res.data.companies ?? []).map(c => ({ value: String(c.id), label: c.name })))
      }
      // On edit, preload the branches for the project's company.
      if (project?.companyId) {
        const bRes = await getBranchesByCompany(project.companyId, token)
        if (bRes.status === 200) {
          setBranchOptions((bRes.data.branches ?? []).map(b => ({ value: String(b.id), label: b.name })))
        }
      }
    }
    load()
  }, [project])

  async function handleCompanyChange(value) {
    setCompanyId(value)
    setBranchId('')
    setBranchOptions([])
    if (!value) return
    const token = localStorage.getItem('accessToken')
    const res = await getBranchesByCompany(Number(value), token)
    if (res.status === 200) {
      setBranchOptions((res.data.branches ?? []).map(b => ({ value: String(b.id), label: b.name })))
    }
  }

  async function handleSave() {
    if (!companyId || !branchId || !projectCode.trim() || !startFrom) {
      setError('Company, Branch, Project Code and Start From are all required.')
      return
    }
    setSaving(true)
    setError('')
    const token = localStorage.getItem('accessToken')
    const res = await saveProject(
      { id: project?.id ?? null, branchId: Number(branchId), projectCode: projectCode.trim(), startFrom },
      token,
    )
    setSaving(false)
    if (res.status === 200) {
      onSaved()
    } else {
      setError(res.message || 'Failed to save project.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg w-96 overflow-hidden">
        <div className="flex items-center justify-between bg-[#14213d] px-5 py-4">
          <h2 className="text-white font-semibold text-sm">{isEdit ? 'Edit Project' : 'Create Project'}</h2>
          <button onClick={onClose} className="text-[#6b7a99] hover:text-white transition-colors duration-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <Select
            label="Company"
            value={companyId}
            onChange={e => handleCompanyChange(e.target.value)}
            options={companyOptions}
            placeholder="Select a company…"
            required
          />
          <Select
            label="Branch"
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            options={branchOptions}
            placeholder={companyId ? 'Select a branch…' : 'Select a company first'}
            required
          />
          <Input
            label="Project Code"
            value={projectCode}
            onChange={e => setProjectCode(e.target.value)}
            placeholder="e.g. SLIMLINE1ST"
            required
          />
          <Input
            label="Start From"
            type="month"
            value={startFrom}
            onChange={e => setStartFrom(e.target.value)}
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

function ProjectDeleteDialog({ project, onClose, onDeleted }) {
  const [summary, setSummary] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const requiredText = `Delete ${project.projectCode}`
  const matches = confirmText === requiredText

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const res = await getProjectDeleteSummary(project.id, token)
      if (res.status === 200) setSummary(res.data.summary)
    }
    load()
  }, [project.id])

  async function handleDelete() {
    if (!matches) {
      setError(`Type exactly: ${requiredText}`)
      return
    }
    setDeleting(true)
    setError('')
    const token = localStorage.getItem('accessToken')
    const res = await deleteProject(project.id, token)
    setDeleting(false)
    if (res.status === 200) {
      onDeleted()
    } else {
      setError(res.message || 'Failed to delete project.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg w-[28rem] overflow-hidden">
        <div className="flex items-center justify-between bg-red-600 px-5 py-4">
          <h2 className="text-white font-semibold text-sm">Delete Project</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors duration-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-[#222] leading-relaxed">
            Deleting <span className="font-semibold text-[#14213d]">{project.projectCode}</span> will also delete{' '}
            {summary ? (
              <><span className="font-semibold">{summary.orderCount}</span> order(s)</>
            ) : (
              'all related orders'
            )}{' '}
            — along with all their customer data.
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

function EndProjectDialog({ project, onClose, onEnded }) {
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [ending, setEnding] = useState(false)

  const requiredText = `End ${project.projectCode}`
  const matches = confirmText === requiredText

  async function handleEnd() {
    if (!matches) {
      setError(`Type exactly: ${requiredText}`)
      return
    }
    setEnding(true)
    setError('')
    const token = localStorage.getItem('accessToken')
    const res = await endProject(project.id, token)
    setEnding(false)
    if (res.status === 200) {
      onEnded()
    } else {
      setError(res.message || 'Failed to end project.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-[#d8d8d8] shadow-lg px-6 py-6 w-[26rem]">
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-full bg-[#fdecd0] flex items-center justify-center">
            <AlertTriangle size={20} className="text-[#c77700]" strokeWidth={2.2} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#222]">End this project?</p>
            <p className="text-xs text-[#aaa] mt-2">Project Code</p>
            <p className="text-base font-bold text-[#14213d] mt-0.5 tracking-wide">{project.projectCode}</p>
          </div>
        </div>
        <p className="text-xs text-[#666] leading-relaxed mb-4">
          Once ended, you can't add new orders or badges to this project, and this can't be reversed.
          Make sure every order has been added to this project before ending.
        </p>
        <Input
          label={`Type "${requiredText}" to confirm`}
          value={confirmText}
          onChange={e => { setConfirmText(e.target.value); setError('') }}
          placeholder={requiredText}
          error={error}
        />
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={onClose} disabled={ending}>Cancel</Button>
          <button
            onClick={handleEnd}
            disabled={!matches || ending}
            className="inline-flex items-center justify-center py-2 px-5 rounded-lg text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer bg-[#fca311] text-[#14213d] hover:bg-[#e0900a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ending ? 'Ending…' : 'End Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectManagementPage() {
  const [projects, setProjects] = useState([])
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [endTarget, setEndTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')
      const res = await getProjectsPaginated({ offset, limit }, token)
      if (res.status === 200) {
        setProjects(res.data.projects)
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
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#14213d]">Projects</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} className="mr-1.5" />
          Create Project
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#d8d8d8] overflow-hidden">
        <ProjectsTable
          projects={projects}
          onEdit={setEditTarget}
          onEnd={setEndTarget}
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
        <ProjectFormModal
          project={null}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); refresh() }}
        />
      )}

      {editTarget && (
        <ProjectFormModal
          project={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); refresh() }}
        />
      )}

      {endTarget && (
        <EndProjectDialog
          project={endTarget}
          onClose={() => setEndTarget(null)}
          onEnded={() => { setEndTarget(null); refresh() }}
        />
      )}

      {deleteTarget && (
        <ProjectDeleteDialog
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refresh() }}
        />
      )}
    </div>
  )
}
