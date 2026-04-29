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
import { FileUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { importNutritionFoods } from '@/app/actions/nutrition-foods'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'

export function NutritionFoodImportDialog({ 
    open, 
    onOpenChange 
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    const queryClient = useQueryClient()
    const [importing, setImporting] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [preview, setPreview] = React.useState<any[]>([])

    // Helper to parse comma decimal strings like "0,01"
    const parseNumber = (val: any): number => {
        if (val === undefined || val === null || val === '') return 0
        if (typeof val === 'number') return val
        const str = val.toString().replace(',', '.')
        return parseFloat(str) || 0
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

                // Detailed mapping from DinhDuong.csv
                const mappedData = rawData.map(row => ({
                    id: row['ID']?.toString(),
                    food_group: row['Nhóm'],
                    food_type: row['Loại'],
                    protein: parseNumber(row['Protein']),
                    carbs: parseNumber(row['Carb']),
                    fat: parseNumber(row['Fat']),
                    fiber: parseNumber(row['Fiber']),
                    unit: row['Đơn vị'],
                    conversion_factor: parseNumber(row['Hệ số chuyển đổi']),
                    image_base64: row['Ảnh'], // Base64 usually comes as string
                    updated_at: new Date().toISOString()
                })).filter(row => row.id && row.food_type) // skip empty rows

                const res = await importNutritionFoods(mappedData)
                if (res.success) {
                    toast.success(`Đã import thành công ${res.count} thực phẩm`)
                    queryClient.invalidateQueries({ queryKey: ['nutrition-foods'] })
                    onOpenChange(false)
                } else {
                    toast.error('Import thất bại: ' + res.error)
                }
                setImporting(false)
            }
            reader.readAsBinaryString(file)
        } catch (error: any) {
            toast.error('Lỗi file: ' + error.message)
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
                    <DialogTitle className="text-xl font-bold uppercase">Import thư viện thực phẩm</DialogTitle>
                    <DialogDescription>
                        Chọn file `DinhDuong.csv` để đồng bộ danh mục thực phẩm vào hệ thống.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
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
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Xem trước dữ liệu (5 thực phẩm đầu)</h4>
                            <div className="border rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                                <ScrollArea className="max-w-full">
                                    <table className="w-full text-[10px] text-left">
                                        <thead className="bg-slate-100 dark:bg-slate-800">
                                            <tr>
                                                <th className="p-2 border-b whitespace-nowrap">ID</th>
                                                <th className="p-2 border-b whitespace-nowrap">Nhóm</th>
                                                <th className="p-2 border-b whitespace-nowrap">Loại (Thực phẩm)</th>
                                                <th className="p-2 border-b whitespace-nowrap text-right">Protein</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="p-2 font-mono">{row['ID']}</td>
                                                    <td className="p-2">{row['Nhóm']}</td>
                                                    <td className="p-2 font-bold">{row['Loại']}</td>
                                                    <td className="p-2 text-right">{row['Protein']}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-[12px] text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                            <p className="font-bold mb-1">Yêu cầu định dạng:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>File phải có các tiêu đề: `ID`, `Nhóm`, `Loại`, `Protein`, `Carb`, `Fat`.</li>
                                <li>Hình ảnh thực phẩm nên ở cột `Ảnh` dưới dạng base64.</li>
                                <li>Hệ thống sẽ cập nhật thông tin nếu `ID` đã tồn tại.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-11">Hủy</Button>
                    <Button 
                        onClick={handleImport} 
                        disabled={importing || !file} 
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 font-bold h-11 shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95"
                    >
                        {importing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Đồng bộ thư viện
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
