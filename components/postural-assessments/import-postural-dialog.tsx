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
import { FileUp, FileDown, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { importPosturalAssessments } from '@/app/actions/postural-assessments'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportPosturalDialog({ 
    open, 
    onOpenChange,
    onSuccess
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    onSuccess?: () => void
}) {
    const queryClient = useQueryClient()
    const [importing, setImporting] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [preview, setPreview] = React.useState<any[]>([])

    const parseBoolean = (val: any): boolean => {
        if (typeof val === 'boolean') return val
        if (typeof val === 'string') {
            const low = val.toLowerCase().trim()
            return low === 'true' || low === 'có' || low === 'x' || low === '1'
        }
        return false
    }

    const downloadTemplate = () => {
        const template = [
            {
                'CLIENT ID (*)': 'HD-001',
                'Ngày đánh giá (dd/MM/yyyy) (*)': '19/04/2025',
                'PT Email': 'pt@example.com',
                'Cổ hướng trước': 'Có',
                'Kyphosis': '',
                'Vai tò': 'Có',
                'Xương chậu quay trước (APT)': '',
                'Xương chậu quay sau (PPT)': '',
                'Gối chụm (Valgus)': '',
                'Gối vòng (Varus)': '',
                'Ghi chú': 'Bị sai lệch nhẹ ở vùng vai'
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'template_danh_gia_sai_lech.xlsx')
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
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
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
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const rawData: any[] = XLSX.utils.sheet_to_json(ws)

                if (rawData.length === 0) {
                    toast.error('File không có dữ liệu')
                    setImporting(false)
                    return
                }

                const mappedData = rawData.map(row => ({
                    client_id: row['CLIENT ID (*)']?.toString(),
                    assessment_date: row['Ngày đánh giá (dd/MM/yyyy) (*)'] ? new Date(row['Ngày đánh giá (dd/MM/yyyy) (*)']).toISOString() : new Date().toISOString(),
                    pt_id: row['PT Email'],
                    neck_forward_head: parseBoolean(row['Cổ hướng trước']),
                    spine_kyphosis: parseBoolean(row['Kyphosis']),
                    shoulder_rounded: parseBoolean(row['Vai tò']),
                    pelvic_tilt_anterior: parseBoolean(row['Xương chậu quay trước (APT)']),
                    pelvic_tilt_posterior: parseBoolean(row['Xương chậu quay sau (PPT)']),
                    knee_valgus: parseBoolean(row['Gối chụm (Valgus)']),
                    knee_varus: parseBoolean(row['Gối vòng (Varus)']),
                    notes: row['Ghi chú'],
                    created_at: new Date().toISOString()
                }))

                const res = await importPosturalAssessments(mappedData)
                if (res.success) {
                    toast.success(`Đã import thành công ${res.count} hồ sơ sai lệch`)
                    queryClient.invalidateQueries({ queryKey: ['postural-assessments-all'] })
                    onSuccess?.()
                    onOpenChange(false)
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
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-4">
                        <FileUp className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold uppercase">Import đánh giá sai lệch</DialogTitle>
                    <DialogDescription>
                        Chọn file Excel để nhập dữ liệu đánh giá sai lệch tư thế hàng loạt.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
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
                                {file ? file.name : "Kéo thả hoặc click để chọn file"}
                            </p>
                        </div>
                    </div>

                    {preview.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Xem trước dữ liệu (5 dòng đầu)</h4>
                            <div className="border rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                                <ScrollArea className="max-w-full">
                                    <table className="w-full text-[10px] text-left">
                                        <thead className="bg-slate-100 dark:bg-slate-800">
                                            <tr>
                                                <th className="p-2 border-b">Hội viên</th>
                                                <th className="p-2 border-b">Ngày</th>
                                                <th className="p-2 border-b">Ghi chú</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="p-2">{row['CLIENT ID (*)']}</td>
                                                    <td className="p-2">{row['Ngày đánh giá (dd/MM/yyyy) (*)']}</td>
                                                    <td className="p-2 truncate">{row['Ghi chú']}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-11">Hủy</Button>
                    <Button 
                        onClick={handleImport} 
                        disabled={importing || !file} 
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-bold h-11"
                    >
                        {importing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Bắt đầu Import
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
