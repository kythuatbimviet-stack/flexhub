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
import { importNutritionDesigns } from '@/app/actions/nutrition-actions'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'

export function NutritionImportDialog({ 
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

    const parsePercentage = (val: any): number => {
        if (!val) return 0
        if (typeof val === 'number') return val * 100 // Excel usually stores % as decimals
        const str = val.toString().replace('%', '').trim()
        return parseFloat(str) || 0
    }

    const downloadTemplate = () => {
        const template = [
            {
                'ClientID': 'HD-001',
                'Giới tính': 'Nam',
                'Chiều cao': 175,
                'Cân nặng': 72,
                'Tuổi': 25,
                'Mức calo nạp vào hàng ngày': 2200,
                'Protein': 150,
                'Carb': 250,
                'Fat': 70,
                'Ngày tạo': new Date().toLocaleDateString('vi-VN')
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'template_tinh_toan_dinh_duong.xlsx')
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

                // Precise mapping from tinhtoan.csv
                const mappedData = rawData.map(row => ({
                    client_id: row['ClientID']?.toString(),
                    gender: row['Giới tính'],
                    height: row['Chiều cao'],
                    weight: row['Cân nặng'],
                    age: row['Tuổi'],
                    waist_circumference: row['Số đo vùng eo (ngang rốn)'],
                    hip_circumference: row['Số đo vòng hông (mông)'],
                    neck_circumference: row['Số đo vòng cổ'],
                    bmi: row['BMI'],
                    body_fat_percentage_bmi: parsePercentage(row['%Bf theo BMI']),
                    body_fat_percentage_navy: parsePercentage(row['%Bf theo Navy formula']),
                    body_fat_percentage_manual: parsePercentage(row['% Bf tự xác định']),
                    body_fat_method: row['Lựa chọn PP tính % Bf']?.replace('Tỷ lệ mỡ cơ thể theo ', ''),
                    body_fat_used: parsePercentage(row['Tỷ lệ mỡ cơ thể']),
                    ffm: row['FFM'],
                    bmr: row['Katch McArdle BMR'],
                    activity_level: row['Mức độ vận động thể chất'],
                    activity_coefficient: row['Hệ số vận động'],
                    tef_percentage: parsePercentage(row['Năng lượng tiêu hóa (TEF)']),
                    rest_energy_expenditure: row['Tổng năng lượng cần cho ngày nghỉ'],
                    training_sessions_per_week: row['Số buổi tập một tuần'],
                    training_duration_per_session: row['Thời gian tập một buổi (phút)'],
                    rt_ee: row['RT EE'],
                    training_energy_expenditure: row['Tổng năng lượng cần cho ngày tập'],
                    energy_delta_percentage: parsePercentage(row['Mức thâm hụt, thặng dư năng lượng']),
                    daily_calorie_intake: row['Mức calo nạp vào hàng ngày'],
                    protein_per_kg: row['Mức Protein'],
                    fat_percentage: parsePercentage(row['Mức Fat']),
                    protein_grams: row['Protein'],
                    carb_grams: row['Carb'],
                    fat_grams: row['Fat'],
                    created_by: row['Người tạo'],
                    created_at: row['Ngày tạo'] ? new Date(row['Ngày tạo']).toISOString() : new Date().toISOString()
                }))

                const res = await importNutritionDesigns(mappedData)
                if (res.success) {
                    toast.success(`Đã import thành công ${res.count} bản ghi`)
                    queryClient.invalidateQueries({ queryKey: ['nutrition-designs'] })
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
                    <DialogTitle className="text-xl font-bold uppercase">Import dữ liệu dinh dưỡng</DialogTitle>
                    <DialogDescription>
                        Nhập dữ liệu tính toán Macro từ file `tinhtoan.csv` hoặc Excel.
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
                                                <th className="p-2 border-b whitespace-nowrap">ClientID</th>
                                                <th className="p-2 border-b whitespace-nowrap">Cân nặng</th>
                                                <th className="p-2 border-b whitespace-nowrap">TDEE</th>
                                                <th className="p-2 border-b whitespace-nowrap">Calories</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="p-2">{row['ClientID']}</td>
                                                    <td className="p-2">{row['Cân nặng']}</td>
                                                    <td className="p-2 whitespace-nowrap">{row['Tổng năng lượng cần cho ngày tập']}</td>
                                                    <td className="p-2">{row['Mức calo nạp vào hàng ngày']}</td>
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
                            <p className="font-bold mb-1">Lưu ý về định dạng:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Phải có cột `ClientID` để định danh hội viên.</li>
                                <li>Các cột tỷ lệ phần trăm (Energy delta, Fat, TEF) có thể để dạng `10%` hoặc số thập phân.</li>
                                <li>Hệ thống sẽ tự động chuyển đổi các công thức cho phù hợp.</li>
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
                                Bắt đầu Import
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
