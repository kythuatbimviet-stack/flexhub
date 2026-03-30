'use client'

import * as React from 'react'
import { FileUp, Loader2, Download, CheckCircle2, AlertCircle, Calendar, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { importCustomers } from '@/app/actions/customers'

interface ImportExcelDialogProps {
    onSuccess: () => void
}

interface ParsedCustomer {
    id: string
    name: string
    shipping_address: string
    phone: string
    email: string
    tax_code: string
    company_name: string
    tax_address: string
    email_tax: string
    legal_rep: string
    position: string
    created_at: string
    updated_at: string
    // preview metadata
    _created_at_raw: string
    _updated_at_raw: string
    _created_at_from_excel: boolean
    _updated_at_from_excel: boolean
}

/**
 * Parse a date value from Excel cell.
 * Excel cells can contain:
 *   - A JS Date object (when xlsx parses date cells)
 *   - A number (Excel serial date)
 *   - A string in various formats:
 *       "3/22/2025 0:00"          (M/D/YYYY H:mm)
 *       "07:28:35 29/3/2026"      (HH:mm:ss D/M/YYYY)
 *       "3/22/2025 07:28:35"      (M/D/YYYY HH:mm:ss)
 *       ISO strings, etc.
 * Returns a Date or null if unparseable.
 */
function parseExcelDate(value: any): Date | null {
    if (value === null || value === undefined || value === '') return null

    // Already a JS Date
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value
    }

    // Excel serial number
    if (typeof value === 'number') {
        const d = XLSX.SSF.parse_date_code(value)
        if (!d) return null
        return new Date(d.y, d.m - 1, d.d, d.H, d.M, d.S)
    }

    const str = String(value).trim()
    if (!str) return null

    // Format: "HH:mm:ss D/M/YYYY" e.g. "07:28:35 29/3/2026"
    const fmt1 = str.match(/^(\d{1,2}):(\d{2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (fmt1) {
        const [, HH, mm, ss, d, m, y] = fmt1
        return new Date(+y, +m - 1, +d, +HH, +mm, +ss)
    }

    // Format: "M/D/YYYY H:mm" or "M/D/YYYY HH:mm:ss" e.g. "3/22/2025 0:00"
    const fmt2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (fmt2) {
        const [, m, d, y, HH, mm, ss] = fmt2
        return new Date(+y, +m - 1, +d, +HH, +mm, +(ss || 0))
    }

    // Format: "D/M/YYYY" only date
    const fmt3 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (fmt3) {
        const [, d, m, y] = fmt3
        return new Date(+y, +m - 1, +d)
    }

    // Try generic Date parse as last resort
    const parsed = new Date(str)
    return isNaN(parsed.getTime()) ? null : parsed
}

function formatDisplayDate(isoStr: string): string {
    if (!isoStr) return '—'
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return isoStr
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
}

export function ImportExcelDialog({ onSuccess }: ImportExcelDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [step, setStep] = React.useState<'upload' | 'preview'>('upload')
    const [isParsing, setIsParsing] = React.useState(false)
    const [isImporting, setIsImporting] = React.useState(false)
    const [previewData, setPreviewData] = React.useState<ParsedCustomer[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleOpenChange = (val: boolean) => {
        setOpen(val)
        if (!val) {
            setStep('upload')
            setPreviewData([])
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsParsing(true)
        const reader = new FileReader()

        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                // Use cellDates:true so xlsx returns JS Date objects for date cells
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'M/D/YYYY H:mm:ss' })

                // Also read raw values for proper date parsing
                const dataRaw = XLSX.utils.sheet_to_json(ws, { raw: true })

                if (data.length === 0) {
                    toast.error('File Excel không có dữ liệu')
                    setIsParsing(false)
                    return
                }

                const now = new Date().toISOString()

                const parsed: ParsedCustomer[] = data.map((row: any, idx: number) => {
                    const rawRow: any = (dataRaw as any[])[idx] || {}

                    // Try parse Ngày tạo
                    const rawCreated = rawRow['Ngày tạo'] ?? row['Ngày tạo'] ?? rawRow['created_at'] ?? row['created_at']
                    const parsedCreated = parseExcelDate(rawCreated)
                    const created_at = parsedCreated ? parsedCreated.toISOString() : now
                    const createdFromExcel = !!parsedCreated

                    // Try parse Ngày cập nhật
                    const rawUpdated = rawRow['Ngày cập nhật'] ?? row['Ngày cập nhật'] ?? rawRow['updated_at'] ?? row['updated_at']
                    const parsedUpdated = parseExcelDate(rawUpdated)
                    const updated_at = parsedUpdated ? parsedUpdated.toISOString() : now
                    const updatedFromExcel = !!parsedUpdated

                    return {
                        id: row['ID'] || `KH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                        name: row['Tên khách hàng'] || row['name'] || '',
                        shipping_address: row['Địa chỉ'] || row['address'] || '',
                        phone: row['Số điện thoại'] || row['phone'] || '',
                        email: row['Email'] || row['email'] || '',
                        tax_code: row['Mã số thuế'] || row['tax_code'] || '',
                        company_name: row['Tên công ty'] || row['company_name'] || '',
                        tax_address: row['Địa chỉ thuế'] || row['tax_address'] || '',
                        email_tax: row['Email nhận hóa đơn'] || row['email_tax'] || '',
                        legal_rep: row['Người đại diện'] || row['legal_rep'] || '',
                        position: row['Chức vụ'] || row['position'] || '',
                        created_at,
                        updated_at,
                        _created_at_raw: String(rawCreated ?? '').trim(),
                        _updated_at_raw: String(rawUpdated ?? '').trim(),
                        _created_at_from_excel: createdFromExcel,
                        _updated_at_from_excel: updatedFromExcel,
                    }
                })

                setPreviewData(parsed)
                setStep('preview')
            } catch (err: any) {
                console.error('Parse Excel error:', err)
                toast.error('Lỗi khi đọc file Excel: ' + err.message)
            } finally {
                setIsParsing(false)
            }
        }

        reader.readAsBinaryString(file)
    }

    const handleConfirmImport = async () => {
        setIsImporting(true)
        try {
            const toInsert = previewData.map(({ _created_at_raw, _updated_at_raw, _created_at_from_excel, _updated_at_from_excel, ...rest }) => rest)
            const result = await importCustomers(toInsert)
            if (!result.success) throw new Error(result.error)
            toast.success(`Đã nhập thành công ${previewData.length} khách hàng`)
            handleOpenChange(false)
            onSuccess()
        } catch (error: any) {
            console.error('Import error:', error)
            toast.error('Lỗi khi nhập dữ liệu: ' + error.message)
        } finally {
            setIsImporting(false)
        }
    }

    const downloadTemplate = () => {
        const now = new Date()
        const template = [
            {
                'ID': 'KH001',
                'Tên khách hàng': 'Nguyễn Văn A',
                'Địa chỉ': '123 Đường ABC, Hà Nội',
                'Số điện thoại': '0123456789',
                'Email': 'a@example.com',
                'Mã số thuế': '0101010101',
                'Tên công ty': 'Công ty TNHH A',
                'Địa chỉ thuế': '123 Đường ABC, Hà Nội',
                'Email nhận hóa đơn': 'ketoan@example.com',
                'Người đại diện': 'Nguyễn Văn A',
                'Chức vụ': 'Giám đốc',
                'Ngày tạo': `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
                'Ngày cập nhật': `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`,
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'customer_template.xlsx')
    }

    // Stats for preview
    const totalFromExcelCreated = previewData.filter(r => r._created_at_from_excel).length
    const totalNowCreated = previewData.filter(r => !r._created_at_from_excel).length
    const totalFromExcelUpdated = previewData.filter(r => r._updated_at_from_excel).length
    const totalNowUpdated = previewData.filter(r => !r._updated_at_from_excel).length

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all font-medium h-11 px-3 sm:px-4">
                    <FileUp className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Nhập Excel</span>
                </Button>
            </DialogTrigger>

            {step === 'upload' && (
                <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl bg-white dark:bg-gray-950">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Nhập khách hàng từ Excel</DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                            Tải lên file Excel (.xlsx, .xls) chứa danh sách khách hàng.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl p-10 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/80 transition-colors cursor-pointer group relative">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={isParsing}
                            />
                            {isParsing ? (
                                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                            ) : (
                                <FileUp className="h-10 w-10 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                            )}
                            <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {isParsing ? 'Đang đọc file...' : 'Chọn file hoặc kéo thả vào đây'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Hỗ trợ .xlsx, .xls</p>
                        </div>

                        <div className="bg-amber-50/60 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-900/20">
                            <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Quy tắc Ngày tạo / Ngày cập nhật</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 leading-relaxed">
                                        Nếu file Excel có giá trị → dùng ngày từ file. Nếu trống → tự động ghi nhận thời điểm hiện tại.
                                        Hỗ trợ format: <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">3/22/2025 0:00</code> và <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">07:28:35 29/3/2026</code>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100/50 dark:border-blue-900/20">
                            <div className="flex items-start gap-3">
                                <Download className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Mẫu file Excel</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Sử dụng file mẫu để đảm bảo dữ liệu được nhập chính xác nhất.</p>
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto text-blue-600 text-xs font-bold mt-2 hover:no-underline"
                                        onClick={downloadTemplate}
                                    >
                                        Tải file mẫu tại đây
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => handleOpenChange(false)}
                            className="rounded-xl font-semibold text-gray-500 dark:text-gray-400"
                        >
                            Hủy bỏ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            )}

            {step === 'preview' && (
                <DialogContent className="max-w-[95vw] xl:max-w-[1200px] rounded-2xl border-none shadow-2xl bg-white dark:bg-gray-950 p-0 overflow-hidden">
                    <div className="flex flex-col h-[90vh] max-h-[800px]">
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Kiểm tra dữ liệu trước khi nhập</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Xem lại dữ liệu được đọc từ file Excel. Kiểm tra kỹ cột <span className="font-semibold text-gray-700 dark:text-gray-300">Ngày tạo</span> và <span className="font-semibold text-gray-700 dark:text-gray-300">Ngày cập nhật</span> trước khi xác nhận.
                                    </p>
                                </div>
                                <Badge variant="secondary" className="shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 font-semibold">
                                    {previewData.length} dòng
                                </Badge>
                            </div>

                            {/* Stats row */}
                            <div className="flex flex-wrap gap-3 mt-4">
                                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                        Ngày tạo từ file: <strong>{totalFromExcelCreated}</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-1.5">
                                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                        Ngày tạo = hiện tại: <strong>{totalNowCreated}</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                        Ngày CN từ file: <strong>{totalFromExcelUpdated}</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-1.5">
                                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                        Ngày CN = hiện tại: <strong>{totalNowUpdated}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">STT</th>
                                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">ID</th>
                                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">Tên khách hàng</th>
                                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">Số điện thoại</th>
                                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">Email</th>
                                        <th className="text-left px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap bg-blue-50 dark:bg-blue-900/20">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-blue-500" />
                                                Ngày tạo
                                            </div>
                                        </th>
                                        <th className="text-left px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap bg-purple-50 dark:bg-purple-900/20">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-purple-500" />
                                                Ngày cập nhật
                                            </div>
                                        </th>
                                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">Tên công ty</th>
                                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">Địa chỉ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-900/40 transition-colors border-b border-gray-50 dark:border-gray-800/50">
                                            <td className="px-3 py-2 text-gray-400 dark:text-gray-600 font-mono">{idx + 1}</td>
                                            <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.id}</td>
                                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200 whitespace-nowrap max-w-[160px] truncate" title={row.name}>{row.name || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}</td>
                                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.phone || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}</td>
                                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[140px] truncate" title={row.email}>{row.email || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}</td>

                                            {/* Ngày tạo */}
                                            <td className="px-3 py-2 bg-blue-50/40 dark:bg-blue-900/10 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    {row._created_at_from_excel ? (
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" title="Lấy từ file Excel" />
                                                    ) : (
                                                        <RefreshCw className="w-3 h-3 text-amber-400 shrink-0" title="Dùng thời gian hiện tại (trống trong file)" />
                                                    )}
                                                    <span className={`font-mono ${row._created_at_from_excel ? 'text-gray-700 dark:text-gray-300' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {formatDisplayDate(row.created_at)}
                                                    </span>
                                                </div>
                                                {!row._created_at_from_excel && row._created_at_raw && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <AlertCircle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                                                        <span className="text-red-400 text-[10px]" title="Giá trị gốc không parse được">
                                                            Gốc: &quot;{row._created_at_raw}&quot;
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Ngày cập nhật */}
                                            <td className="px-3 py-2 bg-purple-50/40 dark:bg-purple-900/10 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    {row._updated_at_from_excel ? (
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" title="Lấy từ file Excel" />
                                                    ) : (
                                                        <RefreshCw className="w-3 h-3 text-amber-400 shrink-0" title="Dùng thời gian hiện tại (trống trong file)" />
                                                    )}
                                                    <span className={`font-mono ${row._updated_at_from_excel ? 'text-gray-700 dark:text-gray-300' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {formatDisplayDate(row.updated_at)}
                                                    </span>
                                                </div>
                                                {!row._updated_at_from_excel && row._updated_at_raw && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <AlertCircle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                                                        <span className="text-red-400 text-[10px]" title="Giá trị gốc không parse được">
                                                            Gốc: &quot;{row._updated_at_raw}&quot;
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" title={row.company_name}>{row.company_name || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}</td>
                                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" title={row.shipping_address}>{row.shipping_address || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800 shrink-0">
                            <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span>Ngày lấy từ file Excel</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <RefreshCw className="w-3 h-3 text-amber-400" />
                                    <span className="text-amber-600 dark:text-amber-400">Ngày trống → dùng thời điểm hiện tại</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3 text-red-400" />
                                    <span className="text-red-500">Giá trị gốc không đọc được (sẽ dùng hiện tại)</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
                            <Button
                                variant="ghost"
                                onClick={() => { setStep('upload'); setPreviewData([]); if (fileInputRef.current) fileInputRef.current.value = '' }}
                                className="rounded-xl font-semibold text-gray-500 dark:text-gray-400"
                                disabled={isImporting}
                            >
                                ← Quay lại
                            </Button>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleOpenChange(false)}
                                    className="rounded-xl font-semibold text-gray-500 dark:text-gray-400"
                                    disabled={isImporting}
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    onClick={handleConfirmImport}
                                    disabled={isImporting}
                                    className="rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang nhập...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Xác nhận nhập {previewData.length} khách hàng
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    )
}
