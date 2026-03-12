'use client'

import * as React from 'react'
import {
    FileText, Save, Copy, Check, RefreshCw, Eye, Code2,
    Plus, Trash2, Building2, Globe, Power, X,
    Tags, RotateCcw, Search, AlertCircle, Pencil,
    BookOpen, PenSquare, EyeOff, LayoutTemplate, AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    fetchAllContractTemplates,
    createContractTemplate,
    updateContractTemplate,
    deleteContractTemplate,
    toggleTemplateStatus,
} from '@/app/actions/contract-templates'
import {
    fetchAllPlaceholders,
    createPlaceholder,
    updatePlaceholder,
    deletePlaceholder,
    togglePlaceholderStatus,
    resetPlaceholdersToDefault,
    type ContractPlaceholder,
} from '@/app/actions/contract-placeholders'
import { DEFAULT_PLACEHOLDERS, type PlaceholderCategory } from '@/lib/placeholder-defaults'
import { fetchBranches } from '@/app/actions/branches'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    parsePrintHFConfig, DEFAULT_HF_CONFIG, PRINT_FONTS,
    type PrintHFConfig, type TextAlign,
} from '@/lib/contract-print-types'

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORIES: { value: PlaceholderCategory | 'all'; label: string; color: string; bg: string; border: string }[] = [
    { value: 'all',      label: 'Tất cả',         color: 'text-gray-600',   bg: 'bg-gray-50',    border: 'border-gray-200'   },
    { value: 'member',   label: 'Hội viên',        color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
    { value: 'center',   label: 'Trung tâm',       color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200' },
    { value: 'package',  label: 'Gói dịch vụ',     color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200'  },
    { value: 'contract', label: 'Hợp đồng',        color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200'    },
    { value: 'general',  label: 'Khác',            color: 'text-gray-500',   bg: 'bg-gray-50',    border: 'border-gray-200'   },
]

function getCategoryMeta(cat: string) {
    return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1]
}

// ── Sample render helper (for template editor preview) ───────────────────────
function renderPreview(content: string, sampleMap: Record<string, string>): string {
    let result = content
    Object.entries(sampleMap).forEach(([key, val]) => {
        result = result.replaceAll(key, `<mark style="background:#fef9c3;color:#92400e;padding:0 2px;border-radius:2px;">${val}</mark>`)
    })
    result = result.replace(/\{\{[^}]+\}\}/g, (match) =>
        `<mark style="background:#fee2e2;color:#b91c1c;padding:0 2px;border-radius:2px;">${match}</mark>`)
    return result
}

// ── Empty form states ─────────────────────────────────────────────────────────
const emptyTemplateForm = { name: '', content: '', branch_id: 'global', is_active: true }
const emptyPlaceholderForm = {
    key: '',
    label: '',
    description: '',
    category: 'general' as PlaceholderCategory,
    sample_value: '',
    is_active: true,
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT: Placeholder Dialog (Add/Edit)
// ════════════════════════════════════════════════════════════════════════════
interface PlaceholderDialogProps {
    open: boolean
    onClose: () => void
    onSaved: () => void
    editing: ContractPlaceholder | null
}

function PlaceholderDialog({ open, onClose, onSaved, editing }: PlaceholderDialogProps) {
    const [form, setForm] = React.useState(emptyPlaceholderForm)
    const [saving, setSaving] = React.useState(false)

    React.useEffect(() => {
        if (editing) {
            setForm({
                key: editing.key,
                label: editing.label,
                description: editing.description || '',
                category: editing.category,
                sample_value: editing.sample_value || '',
                is_active: editing.is_active,
            })
        } else {
            setForm(emptyPlaceholderForm)
        }
    }, [editing, open])

    const handleSave = async () => {
        if (!form.key.trim()) { toast.error('Vui lòng nhập key placeholder'); return }
        if (!form.label.trim()) { toast.error('Vui lòng nhập nhãn'); return }
        setSaving(true)
        try {
            const payload = {
                key: form.key.trim(),
                label: form.label.trim(),
                description: form.description.trim() || null,
                category: form.category,
                sample_value: form.sample_value.trim() || null,
                is_active: form.is_active,
            }
            const res = editing
                ? await updatePlaceholder(editing.id, payload)
                : await createPlaceholder(payload)

            if (res.success) {
                toast.success(editing ? 'Đã cập nhật placeholder!' : 'Đã thêm placeholder mới!')
                onSaved()
                onClose()
            } else {
                toast.error('Lỗi: ' + res.error)
            }
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <Tags className="w-4 h-4 text-red-500" />
                        <h2 className="font-bold text-sm text-gray-700 dark:text-gray-200">
                            {editing ? 'Chỉnh sửa Placeholder' : 'Thêm Placeholder mới'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Key */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-wider text-gray-400">
                            Key Placeholder <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                value={form.key}
                                onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                                placeholder="member_name  hoặc  {{member_name}}"
                                className="h-9 rounded-xl text-sm border-gray-200 dark:border-gray-700 font-mono"
                                disabled={editing?.is_default}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Hệ thống tự thêm <code className="bg-gray-100 px-1 rounded">{'{{ }}'}</code> nếu chưa có.
                            {editing?.is_default && <span className="ml-1 text-amber-500">⚠ Placeholder mặc định — không đổi được key.</span>}
                        </p>
                    </div>

                    {/* Label */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-wider text-gray-400">
                            Nhãn hiển thị <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={form.label}
                            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                            placeholder="VD: Họ và tên hội viên"
                            className="h-9 rounded-xl text-sm border-gray-200 dark:border-gray-700"
                        />
                    </div>

                    {/* Category + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] uppercase tracking-wider text-gray-400">Nhóm</Label>
                            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as PlaceholderCategory }))}>
                                <SelectTrigger className="h-9 rounded-xl text-sm border-gray-200 dark:border-gray-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                                        <SelectItem key={c.value} value={c.value}>
                                            <span className={cn('font-medium', c.color)}>{c.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] uppercase tracking-wider text-gray-400">Trạng thái</Label>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                className={cn(
                                    'h-9 w-full rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                                    form.is_active
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                                )}
                            >
                                <Power className="w-3.5 h-3.5" />
                                {form.is_active ? 'Kích hoạt' : 'Tắt'}
                            </button>
                        </div>
                    </div>

                    {/* Sample Value */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-wider text-gray-400">Giá trị mẫu (preview)</Label>
                        <Input
                            value={form.sample_value}
                            onChange={e => setForm(f => ({ ...f, sample_value: e.target.value }))}
                            placeholder="VD: NGUYỄN THỊ MAI"
                            className="h-9 rounded-xl text-sm border-gray-200 dark:border-gray-700"
                        />
                        <p className="text-[10px] text-gray-400">Dùng để xem trước template. Không ảnh hưởng đến dữ liệu thực.</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-wider text-gray-400">Mô tả (tuỳ chọn)</Label>
                        <Input
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Mô tả ý nghĩa của placeholder..."
                            className="h-9 rounded-xl text-sm border-gray-200 dark:border-gray-700"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} className="h-9 rounded-xl text-sm text-gray-500">
                        Huỷ
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5"
                    >
                        {saving ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                        {editing ? 'Lưu thay đổi' : 'Thêm placeholder'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT: Placeholder Manager Tab
// ════════════════════════════════════════════════════════════════════════════
interface PlaceholderManagerProps {
    placeholders: ContractPlaceholder[]
    loading: boolean
    onReload: () => void
}

function PlaceholderManager({ placeholders, loading, onReload }: PlaceholderManagerProps) {
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<ContractPlaceholder | null>(null)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [activeCategory, setActiveCategory] = React.useState<PlaceholderCategory | 'all'>('all')
    const [resetting, setResetting] = React.useState(false)
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

    const filtered = placeholders.filter(p => {
        const matchCat = activeCategory === 'all' || p.category === activeCategory
        const q = searchQuery.toLowerCase()
        const matchSearch = !q || p.key.toLowerCase().includes(q) || p.label.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
        return matchCat && matchSearch
    })

    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(key)
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 1500)
        toast.success(`Đã copy: ${key}`)
    }

    const handleToggle = async (p: ContractPlaceholder) => {
        const res = await togglePlaceholderStatus(p.id, !p.is_active)
        if (res.success) {
            onReload()
            toast.success(!p.is_active ? 'Đã kích hoạt' : 'Đã tắt')
        } else {
            toast.error('Lỗi: ' + res.error)
        }
    }

    const handleDelete = async (p: ContractPlaceholder) => {
        if (!confirm(`Xóa placeholder "${p.key}"?\n${p.is_default ? '⚠ Đây là placeholder mặc định, bạn có thể reset lại sau.' : ''}`)) return
        const res = await deletePlaceholder(p.id)
        if (res.success) {
            onReload()
            toast.success('Đã xóa placeholder')
        } else {
            toast.error('Lỗi: ' + res.error)
        }
    }

    const handleReset = async () => {
        if (!confirm(`Reset về mặc định?\n\n• Xóa các placeholder mặc định cũ (${DEFAULT_PLACEHOLDERS.length} cái)\n• Khôi phục toàn bộ placeholder mặc định\n• GIỮ NGUYÊN placeholder tùy chỉnh của bạn`)) return
        setResetting(true)
        try {
            const res = await resetPlaceholdersToDefault()
            if (res.success) {
                onReload()
                toast.success(`Đã reset về ${res.count} placeholder mặc định`)
            } else {
                toast.error('Lỗi: ' + res.error)
            }
        } finally {
            setResetting(false)
        }
    }

    // Thống kê
    const stats = {
        total: placeholders.length,
        active: placeholders.filter(p => p.is_active).length,
        defaults: placeholders.filter(p => p.is_default).length,
        custom: placeholders.filter(p => !p.is_default).length,
    }

    return (
        <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Tổng cộng', value: stats.total, color: 'text-gray-700' },
                    { label: 'Đang hoạt động', value: stats.active, color: 'text-emerald-600' },
                    { label: 'Mặc định', value: stats.defaults, color: 'text-blue-600' },
                    { label: 'Tùy chỉnh', value: stats.custom, color: 'text-purple-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 text-center">
                        <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-wide">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm key, nhãn..."
                        className="h-9 pl-9 rounded-xl text-sm border-gray-200 dark:border-gray-700"
                    />
                </div>

                {/* Category filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {CATEGORIES.map(c => (
                        <button
                            key={c.value}
                            onClick={() => setActiveCategory(c.value as PlaceholderCategory | 'all')}
                            className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                                activeCategory === c.value
                                    ? cn(c.bg, c.color, c.border)
                                    : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'
                            )}
                        >
                            {c.label}
                            {c.value !== 'all' && (
                                <span className="ml-1.5 opacity-60">
                                    {placeholders.filter(p => p.category === c.value).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={handleReset}
                        disabled={resetting}
                        title="Reset về placeholder mặc định (giữ placeholder tùy chỉnh)"
                        className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 flex items-center gap-1.5 transition-all"
                    >
                        {resetting
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <RotateCcw className="w-3.5 h-3.5" />}
                        Load lại mặc định
                    </button>
                    <Button
                        onClick={() => { setEditing(null); setDialogOpen(true) }}
                        className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-100"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Thêm placeholder
                    </Button>
                </div>
            </div>

            {/* Placeholder list */}
            {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-300">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
                    <Tags className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">
                        {searchQuery ? `Không tìm thấy placeholder nào với "${searchQuery}"` : 'Chưa có placeholder nào'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={handleReset}
                            className="mt-3 text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
                        >
                            Load placeholder mặc định
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        {['Key', 'Nhãn / Mô tả', 'Nhóm', 'Giá trị mẫu', 'Thao tác'].map(h => (
                            <div key={h} className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</div>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {filtered.map(p => {
                            const catMeta = getCategoryMeta(p.category)
                            return (
                                <div
                                    key={p.id}
                                    className={cn(
                                        'grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30',
                                        !p.is_active && 'opacity-50'
                                    )}
                                >
                                    {/* Key */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        <button
                                            onClick={() => handleCopy(p.key)}
                                            title="Click để copy"
                                            className="group flex items-center gap-1.5 min-w-0"
                                        >
                                            <code className="text-xs font-mono font-bold text-red-600 dark:text-red-400 truncate">
                                                {p.key}
                                            </code>
                                            {copiedKey === p.key
                                                ? <Check className="w-3 h-3 text-green-500 shrink-0" />
                                                : <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />}
                                        </button>
                                        {p.is_default && (
                                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100">
                                                SYS
                                            </span>
                                        )}
                                    </div>

                                    {/* Label / Description */}
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{p.label}</p>
                                        {p.description && (
                                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{p.description}</p>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <span className={cn(
                                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                            catMeta.bg, catMeta.color, catMeta.border
                                        )}>
                                            {catMeta.label}
                                        </span>
                                    </div>

                                    {/* Sample value */}
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-gray-500 truncate font-mono">
                                            {p.sample_value || <span className="text-gray-300 italic">—</span>}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {/* Toggle active */}
                                        <button
                                            title={p.is_active ? 'Tắt' : 'Kích hoạt'}
                                            onClick={() => handleToggle(p)}
                                            className={cn(
                                                'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                                                p.is_active
                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                            )}
                                        >
                                            <Power className="w-3.5 h-3.5" />
                                        </button>
                                        {/* Edit */}
                                        <button
                                            title="Chỉnh sửa"
                                            onClick={() => { setEditing(p); setDialogOpen(true) }}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 text-blue-400 hover:bg-blue-100 transition-all"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {/* Delete */}
                                        <button
                                            title="Xóa"
                                            onClick={() => handleDelete(p)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
                <p className="font-bold text-blue-700 dark:text-blue-300 mb-1.5 text-sm flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Lưu ý khi quản lý Placeholder
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400 text-[12px]">
                    <li>Placeholder có nhãn <strong>SYS</strong> là mặc định — có thể xóa nhưng sẽ được khôi phục khi nhấn "Load lại mặc định"</li>
                    <li>Placeholder mặc định có sẵn mapping trong hệ thống, placeholder tùy chỉnh cần bổ sung logic render trong code</li>
                    <li>"Load lại mặc định" chỉ ảnh hưởng đến placeholder SYS, <strong>không xóa</strong> placeholder bạn tự thêm</li>
                    <li>Click vào key <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded font-mono">{'{{...}}'}</code> để copy nhanh vào clipboard</li>
                </ul>
            </div>

            {/* Dialog */}
            <PlaceholderDialog
                open={dialogOpen}
                onClose={() => { setDialogOpen(false); setEditing(null) }}
                onSaved={onReload}
                editing={editing}
            />
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function ContractTemplatePage() {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get('tab') as 'templates' | 'placeholders' | null

    const [activeMainTab, setActiveMainTab] = React.useState<'templates' | 'placeholders'>('templates')

    React.useEffect(() => {
        if (tabParam === 'placeholders' || tabParam === 'templates') {
            setActiveMainTab(tabParam)
        }
    }, [tabParam])

    // ── Template state ──
    const [templates, setTemplates] = React.useState<any[]>([])
    const [branches, setBranches] = React.useState<any[]>([])
    const [loadingTemplates, setLoadingTemplates] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [isCreating, setIsCreating] = React.useState(false)
    const [form, setForm] = React.useState(emptyTemplateForm)
    const [activeTab, setActiveTab] = React.useState<'html' | 'preview' | 'print'>('html')
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
    const [editMode, setEditMode] = React.useState(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const previewDivRef = React.useRef<HTMLDivElement>(null)
    const [hfConfig, setHfConfig] = React.useState<PrintHFConfig>(DEFAULT_HF_CONFIG)

    // When entering edit mode on preview: populate the div with raw HTML
    React.useEffect(() => {
        if (activeTab === 'preview' && editMode && previewDivRef.current) {
            previewDivRef.current.innerHTML = form.content
        }
    }, [activeTab, editMode])

    // Reset edit mode when switching to html/print tab
    const handleTabChange = (tab: 'html' | 'preview' | 'print') => {
        if (tab !== 'preview' && editMode) setEditMode(false)
        setActiveTab(tab)
    }

    // ── Placeholder state ──
    const [placeholders, setPlaceholders] = React.useState<ContractPlaceholder[]>([])
    const [loadingPlaceholders, setLoadingPlaceholders] = React.useState(true)

    const selectedTemplate = templates.find(t => t.id === selectedId)
    const showEditor = isCreating || !!selectedId

    // Sample map built from DB placeholders
    const sampleMap = React.useMemo(() => {
        const map: Record<string, string> = {}
        placeholders.forEach(p => { if (p.sample_value) map[p.key] = p.sample_value })
        return map
    }, [placeholders])

    // ── Load data ──
    const loadTemplates = React.useCallback(async () => {
        setLoadingTemplates(true)
        const [tRes, bRes] = await Promise.all([fetchAllContractTemplates(), fetchBranches()])
        if (tRes.success) setTemplates(tRes.data || [])
        if (bRes.success) setBranches(bRes.data || [])
        setLoadingTemplates(false)
    }, [])

    const loadPlaceholders = React.useCallback(async () => {
        setLoadingPlaceholders(true)
        const res = await fetchAllPlaceholders()
        if (res.success) {
            setPlaceholders(res.data || [])
            if (res.diagnostics) console.log('[Placeholder] Server Diagnostics:', JSON.stringify(res.diagnostics, null, 2))
        } else {
            console.error('[Placeholder] Load failed:', res.error)
            if (res.diagnostics) console.error('[Placeholder] Diagnostic Trace:', JSON.stringify(res.diagnostics, null, 2))
            toast.error('Không thể tải placeholder: ' + res.error)
        }
        setLoadingPlaceholders(false)
    }, [])

    React.useEffect(() => {
        loadTemplates()
        loadPlaceholders()
    }, [loadTemplates, loadPlaceholders])

    // ── Template editor handlers ──
    const openEditor = (t: any) => {
        setIsCreating(false)
        setSelectedId(t.id)
        setForm({ name: t.name, content: t.content, branch_id: t.branch_id || 'global', is_active: t.is_active })
        setHfConfig(parsePrintHFConfig(t.header_footer_config))
        setActiveTab('html')
        setEditMode(false)
    }
    const startNew = () => {
        setSelectedId(null)
        setIsCreating(true)
        setForm(emptyTemplateForm)
        setHfConfig(DEFAULT_HF_CONFIG)
        setActiveTab('html')
        setEditMode(false)
    }
    const closeEditor = () => { setSelectedId(null); setIsCreating(false) }

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Vui lòng nhập tên mẫu'); return }
        setSaving(true)
        try {
            const payload = {
                name: form.name,
                content: form.content,
                branch_id: form.branch_id === 'global' ? null : form.branch_id,
                is_active: form.is_active,
                header_footer_config: hfConfig,
            }
            let res
            if (isCreating) res = await createContractTemplate(payload)
            else if (selectedId) res = await updateContractTemplate(selectedId, payload)
            if (res?.success) {
                toast.success(isCreating ? 'Đã tạo mẫu mới!' : 'Đã lưu mẫu!')
                await loadTemplates()
                if (isCreating && res.data?.id) { setSelectedId(res.data.id); setIsCreating(false) }
            } else { toast.error('Lỗi: ' + res?.error) }
        } finally { setSaving(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa mẫu này?')) return
        const res = await deleteContractTemplate(id)
        if (res.success) { toast.success('Đã xóa mẫu'); if (selectedId === id) closeEditor(); await loadTemplates() }
        else toast.error('Lỗi: ' + res.error)
    }

    const handleToggle = async (id: string, current: boolean) => {
        const res = await toggleTemplateStatus(id, !current)
        if (res.success) { await loadTemplates(); toast.success(!current ? 'Đã kích hoạt mẫu' : 'Đã tắt mẫu'); if (selectedId === id) setForm(f => ({ ...f, is_active: !current })) }
        else toast.error('Lỗi: ' + res.error)
    }

    const copyPlaceholder = (key: string) => {
        navigator.clipboard.writeText(key)
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 1500)
        toast.success(`Đã copy: ${key}`)
    }

    const insertAtCursor = (key: string) => {
        const ta = textareaRef.current
        if (!ta) { copyPlaceholder(key); return }
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const newContent = form.content.slice(0, start) + key + form.content.slice(end)
        setForm(f => ({ ...f, content: newContent }))
        setTimeout(() => { ta.focus(); ta.setSelectionRange(start + key.length, start + key.length) }, 10)
    }

    // Active placeholders for editor panel
    const activePlaceholders = placeholders.filter(p => p.is_active)

    return (
        <div className="space-y-4 pb-10 font-inter">
            {/* ── Page Header ── */}
            <div className="flex justify-between items-center px-1">
                <div>
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-red-500" />
                        Mẫu hợp đồng
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Quản lý mẫu hợp đồng và placeholder theo chi nhánh.
                    </p>
                </div>
                {activeMainTab === 'templates' && (
                    <Button
                        onClick={startNew}
                        className="rounded-xl h-10 px-5 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-100"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo mẫu mới
                    </Button>
                )}
            </div>

            {/* ── Main Tab navigation ── */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-2xl p-1 border border-gray-100 dark:border-gray-800 shadow-sm w-fit">
                {([
                    { value: 'templates', label: 'Mẫu hợp đồng', icon: BookOpen },
                    { value: 'placeholders', label: 'Quản lý Placeholder', icon: Tags },
                ] as const).map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.value}
                            onClick={() => setActiveMainTab(tab.value)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                                activeMainTab === tab.value
                                    ? 'bg-red-600 text-white shadow'
                                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* ── TEMPLATES TAB ── */}
            {activeMainTab === 'templates' && (
                <div className={cn('gap-5', showEditor ? 'grid grid-cols-1 lg:grid-cols-[340px_1fr]' : 'block')}>
                    {/* Template list */}
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 px-1">
                            Danh sách mẫu ({templates.length})
                        </p>
                        {loadingTemplates ? (
                            <div className="flex items-center justify-center h-40 text-gray-300">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400">
                                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                <p className="text-sm">Chưa có mẫu nào. Bấm "Tạo mẫu mới".</p>
                            </div>
                        ) : (
                            templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => openEditor(t)}
                                    className={cn(
                                        'bg-white dark:bg-gray-900 rounded-2xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md',
                                        selectedId === t.id
                                            ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/10'
                                            : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{t.name}</p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                {t.branch_id ? (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                        <Building2 className="w-2.5 h-2.5" />
                                                        {t.branches?.name || t.branch_id}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
                                                        <Globe className="w-2.5 h-2.5" />
                                                        Tất cả chi nhánh
                                                    </span>
                                                )}
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                    t.is_active
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-gray-50 text-gray-400 border-gray-100'
                                                )}>
                                                    {t.is_active ? '● Đang dùng' : '○ Tắt'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-300 mt-1">
                                                {t.content?.length?.toLocaleString() || 0} ký tự
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button
                                                title={t.is_active ? 'Tắt mẫu' : 'Kích hoạt mẫu'}
                                                onClick={() => handleToggle(t.id, t.is_active)}
                                                className={cn(
                                                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                                                    t.is_active
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                )}
                                            >
                                                <Power className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                title="Xóa mẫu"
                                                onClick={() => handleDelete(t.id)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Editor panel */}
                    {showEditor && (
                        <div className="space-y-3">
                            {/* Form fields */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                        {isCreating ? 'Tạo mẫu mới' : 'Chỉnh sửa mẫu'}
                                    </h2>
                                    <button onClick={closeEditor} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-wider text-gray-400">Tên mẫu *</Label>
                                        <Input
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="VD: Mẫu hợp đồng chuẩn..."
                                            className="h-9 rounded-xl text-sm border-gray-200 dark:border-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-wider text-gray-400">Chi nhánh áp dụng</Label>
                                        <Select value={form.branch_id} onValueChange={v => setForm(f => ({ ...f, branch_id: v }))}>
                                            <SelectTrigger className="h-9 rounded-xl text-sm border-gray-200 dark:border-gray-700">
                                                <SelectValue placeholder="Chọn chi nhánh" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="global">
                                                    <span className="flex items-center gap-1.5">
                                                        <Globe className="w-3.5 h-3.5 text-purple-500" />
                                                        Tất cả chi nhánh (Global)
                                                    </span>
                                                </SelectItem>
                                                {branches.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>
                                                        <span className="flex items-center gap-1.5">
                                                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                                                            {b.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-wider text-gray-400">Trạng thái</Label>
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                            className={cn(
                                                'h-9 w-full rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                                                form.is_active
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                                            )}
                                        >
                                            <Power className="w-4 h-4" />
                                            {form.is_active ? 'Kích hoạt' : 'Không kích hoạt'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Placeholders panel (dynamic from DB) */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                    Placeholders ({activePlaceholders.length}) — Click để {activeTab === 'html' ? 'chèn vào vị trí con trỏ' : 'copy'}
                                </p>
                                {loadingPlaceholders ? (
                                    <div className="flex items-center gap-2 text-gray-300 text-xs">
                                        <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải...
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {activePlaceholders.map(({ key, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => activeTab === 'html' ? insertAtCursor(key) : copyPlaceholder(key)}
                                                className="group flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-red-50 hover:border-red-200 transition-all"
                                            >
                                                <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">{key}</span>
                                                <span className="text-[9px] text-gray-400">({label})</span>
                                                {copiedKey === key
                                                    ? <Check className="w-2.5 h-2.5 text-green-500 ml-1" />
                                                    : <Copy className="w-2.5 h-2.5 text-gray-300 ml-1 group-hover:text-gray-400" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* HTML Editor / Preview */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700">
                                            {([
                                                { value: 'html', label: 'HTML Source', icon: Code2 },
                                                { value: 'preview', label: 'Xem trước', icon: Eye },
                                                { value: 'print', label: 'Cấu hình in', icon: LayoutTemplate },
                                            ] as const).map(t => {
                                                const Icon = t.icon
                                                return (
                                                    <button
                                                        key={t.value}
                                                        onClick={() => handleTabChange(t.value as any)}
                                                        className={cn(
                                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                                            activeTab === t.value ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-gray-700'
                                                        )}
                                                    >
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {t.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {/* Edit mode toggle — only visible in preview tab */}
                                        {activeTab === 'preview' && (
                                            <button
                                                onClick={() => setEditMode(v => !v)}
                                                title={editMode ? 'Tắt chỉnh sửa trực tiếp' : 'Bật chỉnh sửa trực tiếp trong preview'}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                                                    editMode
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'
                                                )}
                                            >
                                                {editMode ? <EyeOff className="w-3.5 h-3.5" /> : <PenSquare className="w-3.5 h-3.5" />}
                                                {editMode ? 'Đang chỉnh sửa' : 'Chỉnh sửa'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-300">{form.content.length.toLocaleString()} ký tự</span>
                                        <Button
                                            onClick={handleSave}
                                            disabled={saving}
                                            size="sm"
                                            className="rounded-xl h-8 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                                        >
                                            {saving ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                                            Lưu mẫu
                                        </Button>
                                    </div>
                                </div>

                                {activeTab === 'html' ? (
                                    <textarea
                                        ref={textareaRef}
                                        value={form.content}
                                        onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                        placeholder={`Paste HTML từ Google Docs vào đây...\n\nCách lấy HTML:\n  1. File → Tải xuống → Trang Web (.html)\n  2. Mở file .html bằng Notepad\n  3. Bôi đen toàn bộ (Ctrl+A) → Copy (Ctrl+C)\n  4. Paste vào đây\n\nChèn {{placeholder}} vào vị trí cần điền dữ liệu tự động.`}
                                        className="w-full min-h-[600px] p-5 font-mono text-xs text-gray-700 dark:text-gray-300 bg-transparent resize-y outline-none border-none placeholder:text-gray-300 leading-relaxed"
                                        spellCheck={false}
                                    />
                                ) : activeTab === 'print' ? (
                                    /* ── PRINT CONFIG TAB ── */
                                    <div className="p-5 space-y-5 min-h-[600px] bg-gray-50/50">
                                        <p className="text-[11px] text-gray-400 italic flex items-center gap-1.5">
                                            <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
                                            Cấu hình Header/Footer sẽ được lưu cùng mẫu và tự động áp dụng khi in.
                                        </p>
                                        {/* HEADER */}
                                        {(() => {
                                            const H = hfConfig.header
                                            const setH = (patch: Partial<typeof H>) => setHfConfig(c => ({ ...c, header: { ...c.header, ...patch } }))
                                            const AlignBtn = ({ val }: { val: TextAlign }) => {
                                                const icon = val === 'left' ? <AlignLeft className="w-3.5 h-3.5"/> : val === 'center' ? <AlignCenter className="w-3.5 h-3.5"/> : <AlignRight className="w-3.5 h-3.5"/>
                                                return <button onClick={() => setH({ textAlign: val })} className={cn('p-1.5 rounded-lg transition-colors', H.textAlign === val ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-100')}>{icon}</button>
                                            }
                                            return (
                                                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 shadow-sm">
                                                    <div className="flex items-center gap-2 pb-2 border-b border-dashed border-purple-100">
                                                        <label className="flex items-center gap-2.5 cursor-pointer">
                                                            <div onClick={() => setH({ enabled: !H.enabled })} className={`w-9 h-5 rounded-full transition-all relative ${H.enabled ? 'bg-purple-500' : 'bg-gray-200'}`}>
                                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${H.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                            </div>
                                                            <span className="text-xs font-bold text-purple-600">HEADER</span>
                                                        </label>
                                                        {H.enabled && <div className="ml-auto flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5"><AlignBtn val="left"/><AlignBtn val="center"/><AlignBtn val="right"/></div>}
                                                    </div>
                                                    {H.enabled && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="col-span-2 space-y-1"><Label className="text-[10px] text-gray-400 uppercase tracking-wider">Logo URL (tùy chọn)</Label><Input value={H.logoUrl} onChange={e => setH({ logoUrl: e.target.value })} placeholder="https://..." className="h-8 text-xs rounded-lg border-gray-200" /></div>
                                                            <div className="col-span-2 space-y-1"><Label className="text-[10px] text-gray-400 uppercase tracking-wider">Tiêu đề HĐ</Label><Input value={H.title} onChange={e => setH({ title: e.target.value })} className="h-8 text-xs rounded-lg border-gray-200" /></div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase tracking-wider">Tên trung tâm</Label><Input value={H.centerName} onChange={e => setH({ centerName: e.target.value })} placeholder="LADYFITS" className="h-8 text-xs rounded-lg border-gray-200" /></div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase tracking-wider">Địa chỉ</Label><Input value={H.address} onChange={e => setH({ address: e.target.value })} placeholder="Địa chỉ..." className="h-8 text-xs rounded-lg border-gray-200" /></div>
                                                            <div className="col-span-2 space-y-1"><Label className="text-[10px] text-gray-400 uppercase tracking-wider">Font chữ</Label>
                                                                <select value={H.fontFamily} onChange={e => setH({ fontFamily: e.target.value })} className="w-full h-8 text-xs rounded-lg border border-gray-200 bg-gray-50 px-2 focus:outline-none focus:ring-1 focus:ring-purple-300">
                                                                    {PRINT_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase">Màu tiêu đề</Label><div className="flex items-center gap-1.5 h-8 border border-gray-200 rounded-lg bg-gray-50 px-2"><input type="color" value={H.titleColor} onChange={e => setH({ titleColor: e.target.value })} className="w-5 h-5 cursor-pointer bg-transparent p-0 border-0"/><span className="text-[10px] font-mono text-gray-400">{H.titleColor}</span></div></div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase">Cỡ tiêu đề (px)</Label><Input type="number" min={8} max={24} value={H.titleSize} onChange={e => setH({ titleSize: +e.target.value })} className="h-8 text-xs rounded-lg border-gray-200 text-center"/></div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase">Màu tên TT</Label><div className="flex items-center gap-1.5 h-8 border border-gray-200 rounded-lg bg-gray-50 px-2"><input type="color" value={H.subColor} onChange={e => setH({ subColor: e.target.value })} className="w-5 h-5 cursor-pointer bg-transparent p-0 border-0"/><span className="text-[10px] font-mono text-gray-400">{H.subColor}</span></div></div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase">Cỡ tên TT (px)</Label><Input type="number" min={8} max={24} value={H.subSize} onChange={e => setH({ subSize: +e.target.value })} className="h-8 text-xs rounded-lg border-gray-200 text-center"/></div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase">Màu địa chỉ</Label><div className="flex items-center gap-1.5 h-8 border border-gray-200 rounded-lg bg-gray-50 px-2"><input type="color" value={H.addrColor} onChange={e => setH({ addrColor: e.target.value })} className="w-5 h-5 cursor-pointer bg-transparent p-0 border-0"/><span className="text-[10px] font-mono text-gray-400">{H.addrColor}</span></div></div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase">Cỡ địa chỉ (px)</Label><Input type="number" min={8} max={24} value={H.addrSize} onChange={e => setH({ addrSize: +e.target.value })} className="h-8 text-xs rounded-lg border-gray-200 text-center"/></div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                        {/* FOOTER */}
                                        {(() => {
                                            const F = hfConfig.footer
                                            const setF = (patch: Partial<typeof F>) => setHfConfig(c => ({ ...c, footer: { ...c.footer, ...patch } }))
                                            const AlignBtn = ({ val }: { val: TextAlign }) => {
                                                const icon = val === 'left' ? <AlignLeft className="w-3.5 h-3.5"/> : val === 'center' ? <AlignCenter className="w-3.5 h-3.5"/> : <AlignRight className="w-3.5 h-3.5"/>
                                                return <button onClick={() => setF({ textAlign: val })} className={cn('p-1.5 rounded-lg transition-colors', F.textAlign === val ? 'bg-rose-100 text-rose-700' : 'text-gray-400 hover:bg-gray-100')}>{icon}</button>
                                            }
                                            return (
                                                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 shadow-sm">
                                                    <div className="flex items-center gap-2 pb-2 border-b border-dashed border-rose-100">
                                                        <label className="flex items-center gap-2.5 cursor-pointer">
                                                            <div onClick={() => setF({ enabled: !F.enabled })} className={`w-9 h-5 rounded-full transition-all relative ${F.enabled ? 'bg-rose-500' : 'bg-gray-200'}`}>
                                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${F.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                            </div>
                                                            <span className="text-xs font-bold text-rose-600">FOOTER</span>
                                                        </label>
                                                        {F.enabled && <div className="ml-auto flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5"><AlignBtn val="left"/><AlignBtn val="center"/><AlignBtn val="right"/></div>}
                                                    </div>
                                                    {F.enabled && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase tracking-wider">Hotline</Label><Input value={F.hotline} onChange={e => setF({ hotline: e.target.value })} placeholder="0832 646 686" className="h-8 text-xs rounded-lg border-gray-200"/></div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase tracking-wider">Email</Label><Input value={F.email} onChange={e => setF({ email: e.target.value })} placeholder="email@..." className="h-8 text-xs rounded-lg border-gray-200"/></div>
                                                            <div className="col-span-2 space-y-1"><Label className="text-[10px] text-gray-400 uppercase tracking-wider">Font chữ</Label>
                                                                <select value={F.fontFamily} onChange={e => setF({ fontFamily: e.target.value })} className="w-full h-8 text-xs rounded-lg border border-gray-200 bg-gray-50 px-2 focus:outline-none focus:ring-1 focus:ring-rose-300">
                                                                    {PRINT_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase">Màu chữ</Label><div className="flex items-center gap-1.5 h-8 border border-gray-200 rounded-lg bg-gray-50 px-2"><input type="color" value={F.color} onChange={e => setF({ color: e.target.value })} className="w-5 h-5 cursor-pointer bg-transparent p-0 border-0"/><span className="text-[10px] font-mono text-gray-400">{F.color}</span></div></div>
                                                            <div className="space-y-1"><Label className="text-[10px] text-gray-400 uppercase">Cỡ chữ (px)</Label><Input type="number" min={8} max={24} value={F.fontSize} onChange={e => setF({ fontSize: +e.target.value })} className="h-8 text-xs rounded-lg border-gray-200 text-center"/></div>
                                                            <div className="col-span-2"><label className="flex items-center gap-2.5 cursor-pointer"><div onClick={() => setF({ showPageNumber: !F.showPageNumber })} className={`w-9 h-5 rounded-full transition-all relative ${F.showPageNumber ? 'bg-rose-400' : 'bg-gray-200'}`}><div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${F.showPageNumber ? 'translate-x-4' : 'translate-x-0.5'}`}/></div><span className="text-xs text-gray-600 font-medium">Hiển thị số trang</span></label></div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                ) : (
                                    <div className="min-h-[600px] overflow-auto bg-white dark:bg-gray-950 relative">
                                        {form.content.trim() ? (
                                            editMode ? (
                                                // ── WYSIWYG edit mode ──
                                                <>
                                                    <div className="sticky top-0 z-10 px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-700">
                                                        <PenSquare className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="font-semibold">Chế độ chỉnh sửa trực tiếp</span>
                                                        <span className="text-amber-500">— chỉnh sửa phần cấu trúc (xóa khoảng trắng, ký tự thừa...). Placeholder màu đỏ vẫn hoạt động bình thường khi in.</span>
                                                    </div>
                                                    <div
                                                        ref={previewDivRef}
                                                        contentEditable
                                                        suppressContentEditableWarning
                                                        onInput={() => {
                                                            if (previewDivRef.current) {
                                                                setForm(f => ({ ...f, content: previewDivRef.current!.innerHTML }))
                                                            }
                                                        }}
                                                        className="p-6 outline-none min-h-[560px] focus:ring-2 focus:ring-amber-200 focus:ring-inset"
                                                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                                    />
                                                </>
                                            ) : (
                                                // ── Preview mode (read-only, sample values highlighted) ──
                                                <div className="p-6" dangerouslySetInnerHTML={{ __html: renderPreview(form.content, sampleMap) }} />
                                            )
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-[600px] text-gray-300 gap-3">
                                                <FileText className="w-12 h-12" />
                                                <p className="text-sm">Chưa có nội dung</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── PLACEHOLDERS TAB ── */}
            {activeMainTab === 'placeholders' && (
                <PlaceholderManager
                    placeholders={placeholders}
                    loading={loadingPlaceholders}
                    onReload={loadPlaceholders}
                />
            )}

            {/* Tips — only show when templates tab and no editor open */}
            {activeMainTab === 'templates' && !showEditor && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
                    <p className="font-bold text-blue-700 dark:text-blue-300 mb-2">💡 Cách hoạt động</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400 text-[13px]">
                        <li>Khi xuất PDF hợp đồng, hệ thống tìm mẫu <strong>Đang dùng</strong> của đúng chi nhánh</li>
                        <li>Nếu không có mẫu của chi nhánh → dùng mẫu <strong>Tất cả chi nhánh</strong> đang kích hoạt</li>
                        <li>Nếu không có mẫu nào → dùng mẫu PDF mặc định của hệ thống</li>
                    </ul>
                </div>
            )}
        </div>
    )
}
