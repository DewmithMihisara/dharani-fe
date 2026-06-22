import { useState, useEffect } from 'react'
import { getCompanies, getBranchesByCompany, getProjectsByBranch } from '../api/orderApi'

const base = 'w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors duration-100'
const enabledCls = `${base} border-[#e5e5e5] bg-white text-[#000] focus:border-[#14213d] cursor-pointer`
const disabledCls = `${base} border-[#eee] bg-[#fafafa] text-[#bbb] cursor-not-allowed`

export default function ProjectPicker({ value, onChange, disabled = false, excludeEndedProjects = false }) {
  const { companyId = null, companyName = '', branchId = null, branchName = '', projectId = null } = value || {}

  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [projects, setProjects] = useState([])

  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    getCompanies(token).then(res => setCompanies(res.data?.companies ?? []))
  }, [])

  useEffect(() => {
    if (!companyId) { setBranches([]); return }
    getBranchesByCompany(companyId, token).then(res => setBranches(res.data?.branches ?? []))
  }, [companyId])

  useEffect(() => {
    if (!branchId) { setProjects([]); return }
    getProjectsByBranch(branchId, token, excludeEndedProjects).then(res => setProjects(res.data?.projects ?? []))
  }, [branchId, excludeEndedProjects])

  function handleCompany(e) {
    const id = e.target.value ? Number(e.target.value) : null
    const name = companies.find(c => c.id === id)?.name ?? ''
    onChange({ companyId: id, companyName: name, branchId: null, branchName: '', projectId: null, projectName: '' })
  }

  function handleBranch(e) {
    const id = e.target.value ? Number(e.target.value) : null
    const name = branches.find(b => b.id === id)?.name ?? ''
    onChange({ companyId, companyName, branchId: id, branchName: name, projectId: null, projectName: '' })
  }

  function handleProject(e) {
    const id = e.target.value ? Number(e.target.value) : null
    const project = projects.find(p => p.id === id)
    onChange({
      companyId, companyName, branchId, branchName,
      projectId: id, projectName: project?.name ?? '',
      projectEnded: project?.ended ?? false,
    })
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#222]">Company<span className="text-[#fca311] ml-0.5">*</span></label>
        <select value={companyId ? String(companyId) : ''} onChange={handleCompany} disabled={disabled}
          className={disabled ? disabledCls : enabledCls}>
          <option value="">Select company…</option>
          {companies.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#222]">Branch<span className="text-[#fca311] ml-0.5">*</span></label>
        <select value={branchId ? String(branchId) : ''} onChange={handleBranch} disabled={disabled || !companyId}
          className={(disabled || !companyId) ? disabledCls : enabledCls}>
          <option value="">Select branch…</option>
          {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#222]">Project<span className="text-[#fca311] ml-0.5">*</span></label>
        <select value={projectId ? String(projectId) : ''} onChange={handleProject} disabled={disabled || !branchId}
          className={(disabled || !branchId) ? disabledCls : enabledCls}>
          <option value="">Select project…</option>
          {projects.map(p => <option key={p.id} value={String(p.id)}>{p.ended ? `${p.name} (Ended)` : p.name}</option>)}
        </select>
      </div>
    </div>
  )
}
