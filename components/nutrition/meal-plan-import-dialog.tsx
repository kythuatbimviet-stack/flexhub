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
import { FileUp, Loader2, AlertCircle, CheckCircle2, FileText, Utensils } from 'lucide-react'
import { toast } from 'sonner'
import { importMealData } from '@/app/actions/nutrition-meal-plans'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'

export function MealPlanImportDialog({ 
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
    const [headerFile, setHeaderFile] = React.useState<File | null>(null)
    const [detailFile, setDetailFile] = React.useState<File | null>(null)

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) setHeaderFile(selectedFile)
    }

    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) setDetailFile(selectedFile)
    }

    const readFileAsJson = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const bstr = e.target?.result
                    const wb = XLSX.read(bstr, { type: 'binary' })
                    const ws = wb.Sheets[wb.SheetNames[0]]
                    const data = XLSX.utils.sheet_to_json(ws)
                    resolve(data)
                } catch (err) {
                    reject(err)
                }
            }
            reader.onerror = reject
            reader.readAsBinaryString(file)
        })
    }

    const handleImport = async () => {
        if (!headerFile || !detailFile) {
            toast.error('Vui lòng chọn cả file Thực đơn và Chi tiết thực đơn')
            return
        }
        
        setImporting(true)
        try {
            const headerData = await readFileAsJson(headerFile)
            const detailData = await readFileAsJson(detailFile)

            if (headerData.length === 0) throw new Error('File Thực đơn trống')

            const mappedHeaders = headerData.map(row => ({
                external_id: row['ID']?.toString(),
                contract_id: row['HDHV ID']?.toString(),
                meal_order: row['Bữa số'],
                name: row['Tên bữa'] || `Bữa ${row['Bữa số']}`,
                kcal: row['Kcal']
            }))

            const mappedDetails = detailData.map(row => ({
                external_id: row['ID']?.toString(),
                meal_external_id: row['ID Thucdon']?.toString(),
                food_id: row['Sản phẩm']?.toString(),
                quantity: row['Số lượng'],
                protein: row['Protein'],
                carb: row['Carb'],
                fat: row['Fat'],
                fiber: row['Fiber'],
                kcal: row['Kcal']
            })).filter(d => d.meal_external_id)

            const res = await importMealData(mappedHeaders, mappedDetails)
            if (res.success) {
                toast.success(`Import thành công: ${res.plansCount} kế hoạch, ${res.mealsCount} bữa ăn, ${res.itemsCount} thực phẩm`)
                queryClient.invalidateQueries({ queryKey: ['nutrition-meal-plans'] })
                onSuccess?.()
                onOpenChange(false)
            } else {
                toast.error('Lỗi import: ' + res.error)
            }
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message)
        } finally {
            setImporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] font-inter">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-[#FD5771]/10 flex items-center justify-center text-[#FD5771] mb-2 border border-[#FD5771]/20">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight text-black dark:text-white">Import Thực đơn & Lịch ăn</DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
                        Bạn cần tải lên cả 2 file `thucdon.csv` và `thucdon_detail.csv` để hệ thống đồng bộ dữ liệu.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Header File */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">1. File Thực đơn (thucdon.csv)</label>
                        <div className={`border-2 border-dashed rounded-2xl p-5 transition-all relative ${headerFile ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'}`}>
                            <input type="file" accept=".csv, .xlsx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleHeaderChange} />
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${headerFile ? 'bg-emerald-100 text-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{headerFile ? headerFile.name : "Chọn file thực đơn..."}</p>
                                    <p className="text-[11px] font-medium text-slate-400">{headerFile ? "Tệp đã sẵn sàng" : "Nhấp hoặc kéo thả tệp vào đây"}</p>
                                </div>
                                {headerFile && <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-300" />}
                            </div>
                        </div>
                    </div>

                    {/* Detail File */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">2. File Chi tiết (thucdon_detail.csv)</label>
                        <div className={`border-2 border-dashed rounded-2xl p-5 transition-all relative ${detailFile ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'}`}>
                            <input type="file" accept=".csv, .xlsx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleDetailChange} />
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${detailFile ? 'bg-emerald-100 text-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}>
                                    <FileUp className="w-5 h-5" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{detailFile ? detailFile.name : "Chọn file chi tiết..."}</p>
                                    <p className="text-[11px] font-medium text-slate-400">{detailFile ? "Tệp đã sẵn sàng" : "Nhấp hoặc kéo thả tệp vào đây"}</p>
                                </div>
                                {detailFile && <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-300" />}
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                        <div className="text-[12px] text-orange-700 dark:text-orange-400 leading-relaxed font-medium">
                            <p className="font-bold mb-1 underline">Yêu cầu dữ liệu:</p>
                            <ul className="list-decimal pl-4 space-y-1">
                                <li>Mã định danh trong cả 2 file phải đồng nhất để khớp dữ liệu.</li>
                                <li>File Thực đơn giúp tạo danh sách bữa ăn, File Chi tiết giúp tạo thực phẩm trong bữa đó.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-11 text-slate-400 hover:text-slate-900 dark:hover:text-white">Hủy</Button>
                    <Button 
                        onClick={handleImport} 
                        disabled={importing || !headerFile || !detailFile} 
                        className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl px-12 font-bold h-11 transition-all shadow-lg active:scale-95"
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
