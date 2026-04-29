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
import { importHealthProfiles } from '@/app/actions/health-profiles'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportHealthDialog({ 
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
                'CLIENT ID': 'HD-001',
                'GIỚI TÍNH': 'Nam',
                'CHIỀU CAO': 175,
                'CÂN NẶNG': 70,
                'TUỔI': 25,
                '% MỠ CƠ THỂ': 15,
                'KINH NGHIỆM': 'Có',
                'GIỜ THỨC': '06:00',
                'GIỜ NGỦ': '23:00',
                'GIỜ TẬP': '18:00',
                'MÓN DỊ ỨNG': 'Không',
                'MÓN ĂN YÊU THÍCH': 'Thịt bò, ức gà',
                'ĐỐI VỚI CÂN NẶNG': 'Muốn giảm mỡ tăng cơ',
                'HOẠT ĐỘNG HÀNG NGÀY': 'Văn phòng',
                'Vai': 45,
                'Ngực': 95,
                'Bắp tay trái': 32,
                'Bắp tay phải': 32,
                'Bụng': 80,
                'Mông': 90,
                'Bắp đùi trái': 50,
                'Bắp đùi phải': 50,
                'Bắp chân trái': 35,
                'Bắp chân phải': 35,
                'Vấn đề tim mạch': '',
                'Huyết áp': 'Ổn định',
                'Bệnh tiểu đường': 'Không',
                'Bệnh hen suyễn': 'Không',
                'Bệnh tiền đình': 'Không',
                'Vấn đề về lưng': 'Hơi mỏi khi ngồi lâu',
                'Dạ dày': 'Tốt',
                'Thần kinh': 'Ổn định',
                'Đau Mỏi Vai Gáy': 'Có',
                'Số giờ ngủ qua đêm/Hours slept last night:7t': 7,
                'Bệnh thần kinh tọa/Sciatica': 'Không',
                'Vấn đề về khớp/Joint Problems': 'Không',
                'Hút thuốc lá/Smoker': 'Không',
                'Uống rượu bia/ Nhậuer': 'Thỉnh thoảng',
                'Thoát vị/Hernia': 'Không',
                'Mới phẩu thuật/Recent Surgery': 'Không',
                'Mất ngủ/Insomnia': 'Không',
                'Lệch hông': 'Không',
                'HOÀN THÀNH BỞI': 'PT Admin'
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'template_ho_so_suc_khoe.xlsx')
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
                    contract_id: (row['CLIENT ID'] || row['ID'])?.toString(),
                    gender: row['GIỚI TÍNH'],
                    height: parseNumber(row['CHIỀU CAO']),
                    weight: parseNumber(row['CÂN NẶNG']),
                    age: parseNumber(row['TUỔI']),
                    body_fat: parseNumber(row['% MỠ CƠ THỂ']),
                    experience: parseBoolean(row['KINH NGHIỆM']),
                    wake_time: row['GIỜ THỨC'],
                    sleep_time: row['GIỜ NGỦ'],
                    train_time: row['GIỜ TẬP'],
                    allergies: row['MÓN DỊ ỨNG'],
                    favorite_foods: row['MÓN ĂN YÊU THÍCH'],
                    weight_strategy: row['ĐỐI VỚI CÂN NẶNG'],
                    daily_activity: row['HOẠT ĐỘNG HÀNG NGÀY'],
                    
                    // Measurements
                    measurement_shoulder: parseNumber(row['Vai']),
                    measurement_chest: parseNumber(row['Ngực']),
                    measurement_bicep_left: parseNumber(row['Bắp tay trái']),
                    measurement_bicep_right: parseNumber(row['Bắp tay phải']),
                    measurement_waist: parseNumber(row['Bụng']),
                    measurement_hip: parseNumber(row['Mông']),
                    measurement_thigh_left: parseNumber(row['Bắp đùi trái']),
                    measurement_thigh_right: parseNumber(row['Bắp đùi phải']),
                    measurement_calf_left: parseNumber(row['Bắp chân trái']),
                    measurement_calf_right: parseNumber(row['Bắp chân phải']),
                    
                    // Medical
                    medical_cardiovascular: row['Vấn đề tim mạch'],
                    medical_blood_pressure: row['Huyết áp'],
                    medical_diabetes: row['Bệnh tiểu đường'],
                    medical_asthma: row['Bệnh hen suyễn'],
                    medical_vestibular: row['Bệnh tiền đình'],
                    medical_back_issue: row['Vấn đề về lưng'],
                    medical_stomach: row['Dạ dày'],
                    medical_nerves: row['Thần kinh'],
                    medical_neck_shoulder_pain: row['Đau Mỏi Vai Gáy'],
                    sleep_hours: parseNumber(row['Số giờ ngủ qua đêm/Hours slept last night:7t']),
                    medical_sciatica: row['Bệnh thần kinh tọa/Sciatica'],
                    medical_joints: row['Vấn đề về khớp/Joint Problems'],
                    is_smoker: parseBoolean(row['Hút thuốc lá/Smoker']),
                    is_alcoholic: parseBoolean(row['Uống rượu bia/ Nhậuer']),
                    medical_hernia: row['Thoát vị/Hernia'],
                    medical_surgery: row['Mới phẩu thuật/Recent Surgery'],
                    medical_insomnia: row['Mất ngủ/Insomnia'],
                    medical_hip_alignment: row['Lệch hông'],
                    
                    created_by: row['Người tạo'] || row['HOÀN THÀNH BỞI'],
                    created_at: row['Ngày tạo'] ? new Date(row['Ngày tạo']).toISOString() : new Date().toISOString()
                }))

                const res = await importHealthProfiles(mappedData)
                if (res.success) {
                    toast.success(`Đã import thành công ${res.count} hồ sơ sức khỏe`)
                    queryClient.invalidateQueries({ queryKey: ['health-profiles'] })
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
                    <DialogTitle className="text-xl font-bold uppercase">Import hồ sơ sức khỏe</DialogTitle>
                    <DialogDescription>
                        Chọn file CSV hoặc Excel (`suckhoe.csv`) để nhập dữ liệu sức khỏe chi tiết.
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
                                                <th className="p-2 border-b">ID / Client</th>
                                                <th className="p-2 border-b">Huyết áp</th>
                                                <th className="p-2 border-b">Tim mạch</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="p-2 font-mono">{row['CLIENT ID'] || row['ID']}</td>
                                                    <td className="p-2 truncate">{row['Huyết áp']}</td>
                                                    <td className="p-2">{row['Vấn đề tim mạch']}</td>
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
                            <p className="font-bold mb-1">Lưu ý trước khi import:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Mã định danh (`CLIENT ID` hoặc `ID`) phải khớp với mã hợp đồng.</li>
                                <li>File phải có các tiêu đề cột đúng như trong file `suckhoe.csv`.</li>
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
