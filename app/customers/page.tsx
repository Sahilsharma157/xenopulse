'use client'

import { MainLayout } from '@/components/layout'
import { useState, useEffect } from 'react'
import { Plus, X, User, Mail, Phone, ShoppingBag, IndianRupee, Calendar, Tag, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  category?: string
  purchase_count: number
  ltv: number
  segment: string
  last_purchase?: string
  created_at: string
}

const segmentColors: Record<string, { bg: string; text: string; dot: string }> = {
  dormant_vip:    { bg: 'bg-purple-50',  text: 'text-purple-700', dot: 'bg-purple-500' },
  one_time_buyer: { bg: 'bg-orange-50',  text: 'text-orange-700', dot: 'bg-orange-500' },
  recent_active:  { bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500'  },
  churn_risk:     { bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-500'    },
  at_risk:        { bg: 'bg-yellow-50',  text: 'text-yellow-700', dot: 'bg-yellow-500' },
  new:            { bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500'   },
}

const segmentLabels: Record<string, string> = {
  dormant_vip:    'Dormant VIP',
  one_time_buyer: 'One-Time Buyer',
  recent_active:  'Recent Active',
  churn_risk:     'Churn Risk',
  at_risk:        'At Risk',
  new:            'New',
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  category: '',
  total_spent: '',
  purchase_count: '',
  last_purchase_date: '',
}

// Defined OUTSIDE the page so it never remounts on parent re-renders
function Field({
  label, icon, name, type = 'text', placeholder, required, hint,
  value, onChange, error,
}: {
  label: string; icon: React.ReactNode; name: string
  type?: string; placeholder: string; required?: boolean; hint?: string
  value: string; onChange: (val: string) => void; error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none z-10">{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg bg-white text-[#111111]
            placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 transition-colors
            ${error
              ? 'border-red-400 focus:ring-red-200'
              : 'border-[#E5E7EB] focus:ring-[#111111]/10 focus:border-[#111111]'}`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  )
}

// Separate date field — no icon overlap, native date picker works correctly
function DateField({
  label, name, hint, value, onChange, error,
}: {
  label: string; name: string; hint?: string
  value: string; onChange: (val: string) => void; error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="date"
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-[#111111]
          focus:outline-none focus:ring-2 transition-colors cursor-pointer
          ${error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-[#E5E7EB] focus:ring-[#111111]/10 focus:border-[#111111]'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  )
}

export default function CustomersPage() {
  const { data: customers = [], isLoading, error } = useSWR<Customer[]>('/api/customers', fetcher)

  const [showModal, setShowModal]   = useState(false)
  const [formData, setFormData]     = useState(EMPTY_FORM)
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Auto-open upload modal if ?upload=true in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upload') === 'true') {
      setShowUpload(true)
      // Clean the URL so refreshing doesn't re-open it
      window.history.replaceState({}, '', '/customers')
    }
  }, [])

  // Upload state
  const [showUpload, setShowUpload]           = useState(false)
  const [uploadPreview, setUploadPreview]     = useState<any[]>([])
  const [uploadFileName, setUploadFileName]   = useState('')
  const [uploadError, setUploadError]         = useState('')
  const [uploading, setUploading]             = useState(false)
  const [uploadSuccess, setUploadSuccess]     = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploadPreview([])
    setUploadFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (rows.length === 0) { setUploadError('File is empty or has no data rows.'); return }

        // Normalise header names (trim + lowercase)
        const normalised = rows.map(row => {
          const out: any = {}
          Object.keys(row).forEach(k => { out[k.trim().toLowerCase().replace(/\s+/g, '_')] = row[k] })
          return out
        })

        // Map common aliases
        const mapped = normalised.map(row => ({
          name:               row.name               || row.full_name || '',
          email:              row.email              || row.email_address || '',
          phone:              row.phone              || row.mobile || row.phone_number || '',
          category:           row.category           || row.type || 'General',
          total_spent:        row.total_spent        || row.ltv  || row.spend || 0,
          purchase_count:     row.purchase_count     || row.orders || row.order_count || 0,
          last_purchase_date: formatDateCell(row.last_purchase_date || row.last_purchase || ''),
        }))

        setUploadPreview(mapped.slice(0, 100)) // show max 100 rows in preview
      } catch (err) {
        setUploadError('Could not read file. Make sure it is a valid .xlsx or .csv file.')
      }
    }
    reader.readAsArrayBuffer(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const formatDateCell = (val: any): string => {
    if (!val) return ''
    // Already a JS Date from xlsx cellDates
    if (val instanceof Date) return val.toISOString().split('T')[0]
    const s = String(val).trim()
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    // Try parsing
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    return s
  }

  const handleUploadConfirm = async () => {
    if (uploadPreview.length === 0) return
    setUploading(true)
    setUploadError('')
    try {
      const res  = await fetch('/api/customers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: uploadPreview }),
      })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error || 'Upload failed'); return }
      mutate('/api/customers')
      setUploadSuccess(`${data.inserted} customers uploaded successfully`)
      setUploadPreview([])
      setUploadFileName('')
      setTimeout(() => {
        setShowUpload(false)
        setUploadSuccess('')
        setSuccessMsg(`${data.inserted} customers added from file`)
        setTimeout(() => setSuccessMsg(''), 5000)
      }, 1800)
    } catch {
      setUploadError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const set = (field: keyof typeof EMPTY_FORM) => (val: string) =>
    setFormData(p => ({ ...p, [field]: val }))

  const formatRupees = (value: number) =>
    '₹' + value.toLocaleString('en-IN')

  const formatDaysAgo = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.name.trim())  e.name  = 'Name is required'
    if (!formData.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email'
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\s/g, '')))
      e.phone = 'Phone must be 10 digits'
    if (formData.total_spent && isNaN(Number(formData.total_spent)))
      e.total_spent = 'Enter a valid number'
    if (formData.purchase_count && isNaN(Number(formData.purchase_count)))
      e.purchase_count = 'Enter a valid number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        name:           formData.name.trim(),
        email:          formData.email.trim(),
        phone:          formData.phone.trim() || null,
        category:       formData.category.trim() || 'General',
        ltv:            Number(formData.total_spent)    || 0,
        purchase_count: Number(formData.purchase_count) || 0,
        last_purchase:  formData.last_purchase_date     || null,
      }
      const res  = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setErrors({ submit: data.error || 'Failed to add customer' }); return }
      mutate('/api/customers')
      setShowModal(false)
      setFormData(EMPTY_FORM)
      setErrors({})
      setSuccessMsg(`${payload.name} was added successfully`)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setFormData(EMPTY_FORM)
    setErrors({})
  }

  // Segment summary counts
  const segmentCounts = customers.reduce((acc, c) => {
    acc[c.segment] = (acc[c.segment] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const SkeletonRow = () => (
    <tr className="border-b border-[#F3F4F6]">
      {[32, 48, 24, 28, 20].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className={`h-3.5 bg-[#F3F4F6] rounded w-${w} animate-pulse`} />
        </td>
      ))}
    </tr>
  )

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-300">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#111111]">Customers</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {customers.length} total across {Object.keys(segmentCounts).length} segments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowUpload(true); setUploadError(''); setUploadPreview([]); setUploadFileName('') }}
              className="flex items-center gap-2 border border-[#E5E7EB] text-[#374151] px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
            >
              <Upload size={15} />
              Upload CSV / Excel
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#222] transition-colors"
            >
              <Plus size={16} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-sm px-4 py-3 rounded-lg animate-in fade-in duration-200">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            Failed to load customers. Please refresh.
          </div>
        )}

        {/* Segment pills */}
        {customers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.entries(segmentCounts).map(([seg, cnt]) => {
              const s = segmentColors[seg] || segmentColors.new
              return (
                <span key={seg} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {segmentLabels[seg] || seg} · {cnt}
                </span>
              )
            })}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  {['Customer', 'Email', 'Total Spent', 'Orders', 'Last Purchase', 'Segment'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-[#F3F4F6] rounded-full flex items-center justify-center">
                          <User size={22} className="text-[#9CA3AF]" />
                        </div>
                        <p className="text-[#111111] font-medium">No customers yet</p>
                        <p className="text-sm text-[#6B7280]">Add your first customer to get started</p>
                        <button
                          onClick={() => setShowModal(true)}
                          className="mt-1 flex items-center gap-1.5 bg-[#0A0A0A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#222] transition-colors"
                        >
                          <Plus size={14} /> Add Customer
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map(c => {
                    const s = segmentColors[c.segment] || segmentColors.new
                    return (
                      <tr key={c.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-[#6B7280]">
                                {c.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-[#111111] whitespace-nowrap">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B7280]">{c.email}</td>
                        <td className="px-6 py-4 font-semibold text-[#111111] whitespace-nowrap">
                          {formatRupees(c.ltv || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B7280] text-center">
                          {c.purchase_count || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B7280] whitespace-nowrap">
                          {formatDaysAgo(c.last_purchase)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                            {segmentLabels[c.segment] || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add Customer Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
              <div>
                <h2 className="text-lg font-semibold text-[#111111]">Add New Customer</h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Segment is auto-calculated from purchase data</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Section: Identity */}
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Basic Info</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name"  icon={<User size={14}/>}  name="name"  placeholder="Rahul Sharma"     required value={formData.name}  onChange={set('name')}  error={errors.name} />
                <Field label="Email" icon={<Mail size={14}/>}  name="email" placeholder="rahul@gmail.com"  required type="email" value={formData.email} onChange={set('email')} error={errors.email} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone"    icon={<Phone size={14}/>} name="phone"    placeholder="9876543210"  hint="10 digits, no +91" value={formData.phone}    onChange={set('phone')}    error={errors.phone} />
                <Field label="Category" icon={<Tag   size={14}/>} name="category" placeholder="Electronics"                         value={formData.category} onChange={set('category')} />
              </div>

              {/* Section: Purchase */}
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest pt-1">Purchase History</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Total Spent (₹)" icon={<IndianRupee  size={14}/>} name="total_spent"   placeholder="4500" hint="Total lifetime value in ₹" value={formData.total_spent}   onChange={set('total_spent')}   error={errors.total_spent} />
                <Field label="No. of Orders"   icon={<ShoppingBag  size={14}/>} name="purchase_count" placeholder="3"   hint="Total purchases made"     value={formData.purchase_count} onChange={set('purchase_count')} error={errors.purchase_count} />
              </div>
              <DateField
                label="Last Purchase Date"
                name="last_purchase_date"
                hint="Used to calculate customer segment"
                value={formData.last_purchase_date}
                onChange={set('last_purchase_date')}
              />

              {/* Segment preview */}
              {(formData.total_spent || formData.purchase_count || formData.last_purchase_date) && (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center gap-2">
                  <span className="text-xs text-[#6B7280]">Segment will be auto-assigned based on spend, orders and last purchase date.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#F3F4F6]">
              <button
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#0A0A0A] text-white rounded-lg hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Add Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Upload Modal ── */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if (!uploading) { setShowUpload(false); setUploadPreview([]); setUploadError('') } }} />

          <div className="relative z-10 w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#F0FDF4] rounded-lg flex items-center justify-center">
                  <FileSpreadsheet size={18} className="text-[#16A34A]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#111111]">Upload Customers</h2>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">CSV or Excel — max 1000 rows</p>
                </div>
              </div>
              <button
                onClick={() => { if (!uploading) { setShowUpload(false); setUploadPreview([]); setUploadError('') } }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex-1 overflow-y-auto space-y-5">

              {uploadSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-14 h-14 bg-[#F0FDF4] rounded-full flex items-center justify-center">
                    <CheckCircle2 size={28} className="text-[#16A34A]" />
                  </div>
                  <p className="text-lg font-semibold text-[#111111]">{uploadSuccess}</p>
                  <p className="text-sm text-[#6B7280]">Your customer list has been updated.</p>
                </div>
              ) : (
                <>
                  {/* Drop zone */}
                  {uploadPreview.length === 0 && (
                    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#E5E7EB] rounded-xl py-12 cursor-pointer hover:border-[#111111] hover:bg-[#F9FAFB] transition-all group">
                      <div className="w-12 h-12 bg-[#F3F4F6] group-hover:bg-[#E5E7EB] rounded-full flex items-center justify-center transition-colors">
                        <Upload size={22} className="text-[#6B7280]" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-[#111111]">Click to choose your file</p>
                        <p className="text-xs text-[#9CA3AF] mt-1">.xlsx or .csv — columns: name, email, phone, category, total_spent, purchase_count, last_purchase_date</p>
                      </div>
                      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}

                  {/* Error */}
                  {uploadError && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{uploadError}</p>
                    </div>
                  )}

                  {/* Preview table */}
                  {uploadPreview.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet size={15} className="text-[#16A34A]" />
                          <span className="text-sm font-medium text-[#111111]">{uploadFileName}</span>
                          <span className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">{uploadPreview.length} rows</span>
                        </div>
                        <label className="text-xs text-[#6B7280] underline cursor-pointer hover:text-[#111111]">
                          Change file
                          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>

                      <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                        <div className="overflow-x-auto max-h-64">
                          <table className="w-full text-xs">
                            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0">
                              <tr>
                                {['#', 'Name', 'Email', 'Phone', 'Category', 'Total Spent', 'Orders', 'Last Purchase'].map(h => (
                                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {uploadPreview.map((row, i) => {
                                const hasError = !row.name || !row.email
                                return (
                                  <tr key={i} className={`border-b border-[#F3F4F6] ${hasError ? 'bg-red-50' : 'hover:bg-[#F9FAFB]'}`}>
                                    <td className="px-3 py-2 text-[#9CA3AF]">{i + 2}</td>
                                    <td className="px-3 py-2 font-medium text-[#111111] whitespace-nowrap">
                                      {row.name || <span className="text-red-500">Missing</span>}
                                    </td>
                                    <td className="px-3 py-2 text-[#6B7280] whitespace-nowrap">
                                      {row.email || <span className="text-red-500">Missing</span>}
                                    </td>
                                    <td className="px-3 py-2 text-[#6B7280]">{row.phone || '—'}</td>
                                    <td className="px-3 py-2 text-[#6B7280]">{row.category || 'General'}</td>
                                    <td className="px-3 py-2 text-[#111111] font-medium">₹{Number(row.total_spent || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-[#6B7280] text-center">{row.purchase_count || 0}</td>
                                    <td className="px-3 py-2 text-[#6B7280] whitespace-nowrap">{row.last_purchase_date || '—'}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <p className="text-xs text-[#9CA3AF]">
                        Rows with the same email will be updated, not duplicated.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!uploadSuccess && uploadPreview.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#F3F4F6] flex-shrink-0">
                <p className="text-sm text-[#6B7280]">
                  Ready to upload <span className="font-semibold text-[#111111]">{uploadPreview.length}</span> customers
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setUploadPreview([]); setUploadFileName(''); setUploadError('') }}
                    disabled={uploading}
                    className="px-4 py-2.5 text-sm font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleUploadConfirm}
                    disabled={uploading}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#0A0A0A] text-white rounded-lg hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                    ) : (
                      <><ChevronRight size={15} /> Confirm Upload</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  )
}
