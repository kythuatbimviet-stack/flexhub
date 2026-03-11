'use client'

import * as React from 'react'
import {
    FileText, Save, Copy, Check, RefreshCw, Eye, Code2,
    Plus, Trash2, Building2, Globe, Power, Edit2, X
} from 'lucide-react'
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
import { fetchBranches } from '@/app/actions/branches'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// ── Placeholders ────────────────────────────────────────────────────────────
const PLACEHOLDERS = [
    { key: '{{member_name}}', label: 'Họ và tên' },
    { key: '{{phone}}', label: 'Số điện thoại' },
    { key: '{{email}}', label: 'Email' },
    { key: '{{dob}}', label: 'Ngày sinh' },
    { key: '{{address}}', label: 'Địa chỉ' },
    { key: '{{id_number}}', label: 'CMND/CCCD' },
    { key: '{{package_name}}', label: 'Gói tập' },
    { key: '{{total_sessions}}', label: 'Số buổi' },
    { key: '{{start_date}}', label: 'Ngày bắt đầu' },
    { key: '{{end_date}}', label: 'Ngày kết thúc' },
    { key: '{{total_amount}}', label: 'Tổng tiền' },
    { key: '{{total_amount_words}}', label: 'Tổng tiền (chữ)' },
    { key: '{{trainer_name}}', label: 'Tên HLV' },
    { key: '{{trainer_type}}', label: 'Hình thức HL' },
    { key: '{{center_representative}}', label: 'Đại diện TT' },
    { key: '{{center_name}}', label: 'Tên trung tâm' },
    { key: '{{contract_id}}', label: 'Mã hợp đồng' },
    { key: '{{signing_date}}', label: 'Ngày ký' },
    { key: '{{payment_method}}', label: 'Hình thức TT' },
    { key: '{{initial_height}}', label: 'Chiều cao' },
    { key: '{{initial_weight}}', label: 'Cân nặng' },
    { key: '{{medical_condition}}', label: 'Bệnh lý' },
    // Branch fields
    { key: '{{center_phone}}', label: 'SĐT trung tâm' },
    { key: '{{center_address}}', label: 'Địa chỉ TT' },
    { key: '{{legal_representative}}', label: 'Người đại diện PL' },
    { key: '{{representative_phone}}', label: 'SĐT đại diện' },
]

const SAMPLE_DATA: Record<string, string> = {
    '{{member_name}}': 'NGUYỄN THỊ MAI',
    '{{phone}}': '0912 345 678',
    '{{email}}': 'mai.nguyen@email.com',
    '{{dob}}': '15/03/1995',
    '{{address}}': '123 Đường Lê Lợi, Quận 1, TP.HCM',
    '{{id_number}}': '079195012345',
    '{{package_name}}': 'GÓI PT CAO CẤP 3 THÁNG',
    '{{total_sessions}}': '36',
    '{{start_date}}': '01/04/2026',
    '{{end_date}}': '30/06/2026',
    '{{total_amount}}': '12.000.000 ₫',
    '{{total_amount_words}}': 'Mười hai triệu',
    '{{trainer_name}}': 'Trần Văn Hùng',
    '{{trainer_type}}': 'Trực tiếp',
    '{{center_representative}}': 'Nguyễn Minh Trí',
    '{{center_name}}': 'TRUNG TÂM LADY FIT',
    '{{contract_id}}': 'HĐ-2026-0001',
    '{{signing_date}}': '01/04/2026',
    '{{payment_method}}': 'Tiền mặt',
    '{{initial_height}}': '162',
    '{{initial_weight}}': '55',
    '{{medical_condition}}': 'Không',
    '{{center_phone}}': '028 1234 5678',
    '{{center_address}}': '456 Nguyễn Trãi, Quận 5, TP.HCM',
    '{{legal_representative}}': 'NGUYỄN VĂN AN',
    '{{representative_phone}}': '0901 234 567',
}

function renderPreview(content: string): string {
    let result = content
    Object.entries(SAMPLE_DATA).forEach(([key, val]) => {
        result = result.replaceAll(key, `<mark style="background:#fef9c3;color:#92400e;padding:0 2px;border-radius:2px;">${val}</mark>`)
    })
    result = result.replace(/\{\{[^}]+\}\}/g, (match) =>
        `<mark style="background:#fee2e2;color:#b91c1c;padding:0 2px;border-radius:2px;">${match}</mark>`)
    return result
}

// ── Empty form state ─────────────────────────────────────────────────────────
const emptyForm = { name: '', content: '', branch_id: 'global', is_active: true }

export default function ContractTemplatePage() {
    const [templates, setTemplates] = React.useState<any[]>([])
    const [branches, setBranches] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)

    // Selected template for editing
    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [isCreating, setIsCreating] = React.useState(false)

    // Editor form state
    const [form, setForm] = React.useState(emptyForm)
    const [activeTab, setActiveTab] = React.useState<'html' | 'preview'>('html')
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    const selectedTemplate = templates.find(t => t.id === selectedId)

    // Load data
    const loadData = React.useCallback(async () => {
        setLoading(true)
        const [tRes, bRes] = await Promise.all([
            fetchAllContractTemplates(),
            fetchBranches(),
        ])
        if (tRes.success) setTemplates(tRes.data || [])
        if (bRes.success) setBranches(bRes.data || [])
        setLoading(false)
    }, [])

    React.useEffect(() => { loadData() }, [loadData])

    // Open editor for existing template
    const openEditor = (t: any) => {
        setIsCreating(false)
        setSelectedId(t.id)
        setForm({
            name: t.name,
            content: t.content,
            branch_id: t.branch_id || 'global',
            is_active: t.is_active,
        })
        setActiveTab('html')
    }

    // Start creating new
    const startNew = () => {
        setSelectedId(null)
        setIsCreating(true)
        setForm(emptyForm)
        setActiveTab('html')
    }

    const closeEditor = () => {
        setSelectedId(null)
        setIsCreating(false)
    }

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Vui lòng nhập tên mẫu'); return }
        setSaving(true)
        try {
            const payload = {
                name: form.name,
                content: form.content,
                branch_id: form.branch_id === 'global' ? null : form.branch_id,
                is_active: form.is_active,
            }
            let res
            if (isCreating) {
                res = await createContractTemplate(payload)
            } else if (selectedId) {
                res = await updateContractTemplate(selectedId, payload)
            }
            if (res?.success) {
                toast.success(isCreating ? 'Đã tạo mẫu mới!' : 'Đã lưu mẫu!')
                await loadData()
                if (isCreating && res.data?.id) {
                    setSelectedId(res.data.id)
                    setIsCreating(false)
                }
            } else {
                toast.error('Lỗi: ' + res?.error)
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa mẫu này?')) return
        const res = await deleteContractTemplate(id)
        if (res.success) {
            toast.success('Đã xóa mẫu')
            if (selectedId === id) closeEditor()
            await loadData()
        } else {
            toast.error('Lỗi: ' + res.error)
        }
    }

    const handleToggle = async (id: string, current: boolean) => {
        const res = await toggleTemplateStatus(id, !current)
        if (res.success) {
            await loadData()
            toast.success(!current ? 'Đã kích hoạt mẫu' : 'Đã tắt mẫu')
            if (selectedId === id) setForm(f => ({ ...f, is_active: !current }))
        } else {
            toast.error('Lỗi: ' + res.error)
        }
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
        setTimeout(() => {
            ta.focus()
            ta.setSelectionRange(start + key.length, start + key.length)
        }, 10)
    }

    const showEditor = isCreating || !!selectedId

    return (
        <div className="space-y-4 pb-10 font-inter">
            {/* Header */}
            <div className="flex justify-between items-center px-1">
                <div>
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-red-500" />
                        Mẫu hợp đồng
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Quản lý các mẫu hợp đồng theo chi nhánh. Mẫu được kích hoạt sẽ được dùng khi xuất PDF.
                    </p>
                </div>
                <Button
                    onClick={startNew}
                    className="rounded-xl h-10 px-5 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-100"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo mẫu mới
                </Button>
            </div>

            <div className={cn('gap-5', showEditor ? 'grid grid-cols-1 lg:grid-cols-[340px_1fr]' : 'block')}>
                {/* ── Template list ── */}
                <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 px-1">
                        Danh sách mẫu ({templates.length})
                    </p>
                    {loading ? (
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
                                            {/* Branch badge */}
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
                                            {/* Status badge */}
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
                                    {/* Actions */}
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

                {/* ── Editor panel ── */}
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
                                    <Select
                                        value={form.branch_id}
                                        onValueChange={v => setForm(f => ({ ...f, branch_id: v }))}
                                    >
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

                        {/* Placeholders */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Placeholders — Click để {activeTab === 'html' ? 'chèn vào vị trí con trỏ' : 'copy'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {PLACEHOLDERS.map(({ key, label }) => (
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
                        </div>

                        {/* HTML Editor / Preview */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                            {/* Toolbar */}
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => setActiveTab('html')}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                            activeTab === 'html' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-gray-700'
                                        )}
                                    >
                                        <Code2 className="w-3.5 h-3.5" />
                                        HTML Source
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('preview')}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                            activeTab === 'preview' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-gray-700'
                                        )}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Xem trước
                                    </button>
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
                            ) : (
                                <div className="min-h-[600px] overflow-auto bg-white dark:bg-gray-950">
                                    {form.content.trim() ? (
                                        <div className="p-6" dangerouslySetInnerHTML={{ __html: renderPreview(form.content) }} />
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

            {/* Tips — only show when no editor open */}
            {!showEditor && (
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
