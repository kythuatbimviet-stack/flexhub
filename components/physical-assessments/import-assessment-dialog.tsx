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
import { importPhysicalAssessments } from '@/app/actions/physical-assessments'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportAssessmentDialog({ 
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
                'HDHV id': 'HD-001',
                'Đầu hướng ra trước': 'Có',
                'Ghi chú cổ': '',
                'Gù lưng': '',
                'Võng lưng': '',
                'Vai không đều': 'Có',
                'Khum vai': '',
                'Xương chậu quay ra trước': '',
                'Chụm gối': '',
                'Chân vòng kiềng': '',
                'Quay ngửa': '',
                'Quay sấp': '',
                'Người tạo': 'PT Admin'
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'template_danh_gia_the_trang.xlsx')
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

                const mappedData = rawData.map(row => ({
                    contract_id: row['HDHV id']?.toString(),
                    
                    neck_forward_head: parseBoolean(row['Đầu hướng ra trước']),
                    neck_image_url: row['Ảnh chụp đầu'],
                    neck_notes: row['Ghi chú cổ'],
                    
                    back_kyphosis: parseBoolean(row['Gù lưng']),
                    back_lordosis: parseBoolean(row['Võng lưng']),
                    back_notes: row['Ghi chú lưng'],
                    back_image_url: row['Ảnh chụp lưng'],
                    
                    shoulder_uneven: parseBoolean(row['Vai không đều']),
                    shoulder_rounded: parseBoolean(row['Khum vai']),
                    shoulder_image_url: row['Ảnh chụp Vai'],
                    shoulder_notes: row['Ghi chú vai'],
                    
                    pelvis_anterior_tilt: parseBoolean(row['Xương chậu quay ra trước']),
                    pelvis_posterior_tilt: parseBoolean(row['Xương chậu quay ra sau']),
                    pelvis_image_url: row['Ảnh chụp Hông'],
                    pelvis_notes: row['Ghi chú hông'],
                    
                    knee_knock_knees: parseBoolean(row['Chụm gối']),
                    knee_bow_legs: parseBoolean(row['Chân vòng kiềng']),
                    knee_hyperextended: parseBoolean(row['Duỗi quá mức']),
                    knee_image_url: row['Ảnh chụp Goi'],
                    knee_notes: row['Ghi chú gối'],
                    
                    foot_supination: parseBoolean(row['Quay ngửa']),
                    foot_pronation: parseBoolean(row['Quay sấp']),
                    foot_image_url: row['Ảnh chụp chan'],
                    foot_notes: row['Ghi chú bàn chân'],
                    
                    created_by: row['Người tạo'],
                    created_at: row['Ngày tạo'] ? new Date(row['Ngày tạo']).toISOString() : new Date().toISOString()
                }))

                const res = await importPhysicalAssessments(mappedData)
                if (res.success) {
                    toast.success(`Đã import thành công ${res.count} bản ghi tư thế`)
                    queryClient.invalidateQueries({ queryKey: ['physical-assessments'] })
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
                    <DialogTitle className="text-xl font-bold uppercase">Import dữ liệu tư thế</DialogTitle>
                    <DialogDescription>
                        Chọn file CSV hoặc Excel (`thetrang.csv`) để nhập dữ liệu tư thế hàng loạt.
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
                                            <th className="p-2 border-b">ID HĐ</th>
                                            <th className="p-2 border-b">Vai không đều</th>
                                            <th className="p-2 border-b">Gù lưng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i} className="border-b last:border-0">
                                                <td className="p-2">{row['HDHV id']}</td>
                                                <td className="p-2">{row['Vai không đều']}</td>
                                                <td className="p-2">{row['Gù lưng']}</td>
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
