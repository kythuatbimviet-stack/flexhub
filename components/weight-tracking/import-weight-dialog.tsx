'use client'

import React from 'react'
import * as XLSX from 'xlsx'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileUp, FileDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { importWeightRecords } from '@/app/actions/weight-tracking'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportWeightDialog({
    open,
    onOpenChange,
    onSuccess
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}) {
    const queryClient = useQueryClient()
    const [importing, setImporting] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [preview, setPreview] = React.useState<any[]>([])

    const parseNumber = (val: any): number | null => {
        if (val === undefined || val === null || val === '') return null
        if (typeof val === 'number') return val
        const str = val.toString().replace(',', '.').trim()
        const n = parseFloat(str)
        return isNaN(n) ? null : n
    }

    const downloadTemplate = () => {
        const template = [
            {
                'Mã hợp đồng (*)': 'HD-001',
                'Ngày đo (dd/MM/yyyy) (*)': '19/04/2025',
                'Cân nặng thực tế (kg) (*)': 72.5,
                'Cân nặng mục tiêu (kg)': 68,
                'Chiều cao (cm)': 170,
                'Ghi chú': 'Đo buổi sáng',
                'Ngày hẹn tiếp theo (dd/MM/yyyy)': '26/04/2025',
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        ws['!cols'] = [
            { wch: 24 }, { wch: 28 }, { wch: 26 }, { wch: 24 }, { wch: 16 }, { wch: 20 }, { wch: 30 }
        ]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'template_theo_doi_can_nang.xlsx')
        toast.success('Đã tải file template mẫu')
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            const reader = new FileReader()
            reader.onload = (event) => {
                const bstr = event.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const ws = wb.Sheets[wb.SheetNames[0]]
                const data = XLSX.utils.sheet_to_json(ws)
                setPreview(data.slice(0, 5))
            }
            reader.readAsBinaryString(selectedFile)
        }
    }

    const handleImport = async () => {
        if (!file) return
        setImporting(true)
        try {
            const reader = new FileReader()
            reader.onload = async (event) => {
                const bstr = event.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const ws = wb.Sheets[wb.SheetNames[0]]
                const rawData: any[] = XLSX.utils.sheet_to_json(ws)

                if (rawData.length === 0) {
                    toast.error('File không có dữ liệu')
                    setImporting(false)
                    return
                }

                const parseDate = (val: any): string => {
                    if (!val) return new Date().toISOString()
                    const str = val.toString().trim()
                    // dd/MM/yyyy
                    const parts = str.split('/')
                    if (parts.length === 3) {
                        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString()
                    }
                    return new Date(str).toISOString()
                }

                const mappedData = rawData.map(row => ({
                    contract_id: row['Mã hợp đồng (*)']?.toString() || row['contract_id']?.toString(),
                    measurement_date: parseDate(row['Ngày đo (dd/MM/yyyy) (*)'] || row['measurement_date']),
                    weight: parseNumber(row['Cân nặng thực tế (kg) (*)'] || row['weight']),
                    target_weight: parseNumber(row['Cân nặng mục tiêu (kg)'] || row['target_weight']),
                    height: parseNumber(row['Chiều cao (cm)'] || row['height']),
                    measurements: row['Ghi chú'] || row['measurements'] || '',
                    next_measurement_date: row['Ngày hẹn tiếp theo (dd/MM/yyyy)']
                        ? parseDate(row['Ngày hẹn tiếp theo (dd/MM/yyyy)'])
                        : null,
                })).filter(r => r.contract_id && r.weight)

                const res = await importWeightRecords(mappedData)
                if (res.success) {
                    toast.success(`Đã import thành công ${res.count} bản ghi cân nặng`)
                    queryClient.invalidateQueries({ queryKey: ['weight-records'] })
                    onSuccess?.()
                    onOpenChange(false)
                    setFile(null)
                    setPreview([])
                } else {
                    toast.error('Import thất bại: ' + res.error)
                }
                setImporting(false)
            }
            reader.readAsBinaryString(file)
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message)
            setImporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] font-inter">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4">
                        <FileUp className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold uppercase">Import theo dõi cân nặng</DialogTitle>
                    <DialogDescription>
                        Nhập dữ liệu theo dõi cân nặng hàng loạt từ file Excel.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={downloadTemplate}
                        className="text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-xl h-9 px-4 font-bold text-xs"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        Tải file template mẫu
                    </Button>

                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer relative">
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                        />
                        <div className="flex flex-col items-center gap-2">
                            <FileUp className="w-10 h-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {file ? file.name : 'Kéo thả hoặc click để chọn file'}
                            </p>
                            <p className="text-xs text-slate-400">.xlsx, .xls, .csv</p>
                        </div>
                    </div>

                    {preview.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Xem trước (5 dòng đầu)</h4>
                            <div className="border rounded-xl overflow-hidden">
                                <ScrollArea className="max-w-full">
                                    <table className="w-full text-[10px] text-left">
                                        <thead className="bg-slate-100 dark:bg-slate-800">
                                            <tr>
                                                <th className="p-2 border-b">Mã HĐ</th>
                                                <th className="p-2 border-b">Ngày đo</th>
                                                <th className="p-2 border-b">Cân nặng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="p-2 font-mono">{row['Mã hợp đồng (*)'] || row['contract_id']}</td>
                                                    <td className="p-2">{row['Ngày đo (dd/MM/yyyy) (*)'] || row['measurement_date']}</td>
                                                    <td className="p-2 font-bold">{row['Cân nặng thực tế (kg) (*)'] || row['weight']}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                        <div className="text-[12px] text-orange-700 dark:text-orange-400 leading-relaxed font-medium">
                            <p className="font-bold mb-1">Lưu ý:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Cột đánh dấu (*) là bắt buộc.</li>
                                <li>Mã hợp đồng phải tồn tại trong hệ thống.</li>
                                <li>Ngày định dạng dd/MM/yyyy (ví dụ: 19/04/2025).</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-11">Hủy</Button>
                    <Button
                        onClick={handleImport}
                        disabled={importing || !file}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 font-bold h-11 transition-all active:scale-95"
                    >
                        {importing ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xử lý...</>
                        ) : (
                            <><CheckCircle2 className="w-4 h-4 mr-2" />Bắt đầu Import</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
