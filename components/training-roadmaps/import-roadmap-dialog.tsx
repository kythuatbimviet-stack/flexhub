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
import { FileUp, FileDown, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { importTrainingRoadmaps } from '@/app/actions/training-roadmaps'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportRoadmapDialog({ 
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

    const downloadTemplate = () => {
        const template = [
            {
                'CLIENT ID (*)': 'HD-001',
                'Mục tiêu (*)': 'Giảm 5kg mỡ, tăng cơ bắp vùng vai',
                'Thời gian tổng quát (*)': '3 Tháng / 36 Buổi',
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'template_lo_trinh_tap_luyen.xlsx')
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
                    goal: row['Mục tiêu (*)'],
                    duration_overall: row['Thời gian tổng quát (*)'],
                }))

                const res = await importTrainingRoadmaps(mappedData)
                if (res.success) {
                    toast.success(`Đã import thành công ${res.count} lộ trình tập luyện`)
                    queryClient.invalidateQueries({ queryKey: ['all-active-roadmaps'] })
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
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4">
                        <FileUp className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Import lộ trình tập luyện</DialogTitle>
                    <DialogDescription>
                        Chọn file Excel để nhập lộ trình tập luyện cho hội viên hàng loạt.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={downloadTemplate}
                        className="text-[#FD5771] hover:bg-red-50 border-red-100 rounded-xl h-9 px-4 font-semibold text-xs transition-all"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        Tải file template mẫu
                    </Button>

                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer relative group">
                        <input 
                            type="file" 
                            accept=".csv, .xlsx, .xls" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={handleFileChange}
                        />
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileUp className="w-6 h-6 text-slate-400 group-hover:text-[#FD5771]" />
                            </div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {file ? file.name : "Kéo thả hoặc click để chọn file"}
                            </p>
                        </div>
                    </div>

                    {preview.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Xem trước dữ liệu (5 dòng đầu)</h4>
                            <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                                <ScrollArea className="max-w-full">
                                    <table className="w-full text-[11px] text-left">
                                        <thead className="bg-slate-100/50 dark:bg-slate-800">
                                            <tr>
                                                <th className="p-3 border-b font-bold text-slate-700">CLIENT ID</th>
                                                <th className="p-3 border-b font-bold text-slate-700">Mục tiêu</th>
                                                <th className="p-3 border-b font-bold text-slate-700">Thời gian</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i} className="border-b last:border-0 border-slate-50">
                                                    <td className="p-3 font-medium">{row['CLIENT ID (*)']}</td>
                                                    <td className="p-3 truncate max-w-[200px]">{row['Mục tiêu (*)']}</td>
                                                    <td className="p-3">{row['Thời gian tổng quát (*)']}</td>
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
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-semibold h-11 text-slate-500">Hủy</Button>
                    <Button 
                        onClick={handleImport} 
                        disabled={importing || !file} 
                        className="bg-black hover:bg-slate-800 text-white rounded-xl px-8 font-semibold h-11 transition-all shadow-sm"
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
