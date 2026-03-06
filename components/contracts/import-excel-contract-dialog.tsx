'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileUp, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { importContracts } from '@/app/actions/contracts'
import { motion, AnimatePresence } from 'framer-motion'

export function ImportExcelContractDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [previewData, setPreviewData] = React.useState<any[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)
                setPreviewData(data)
                toast.success(`Đã đọc ${data.length} dòng từ file`)
            } catch (error) {
                toast.error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng.')
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleImport = async () => {
        if (previewData.length === 0) return
        setLoading(true)
        try {
            // Map Excel columns to database fields if necessary
            const mappedData = previewData.map(item => ({
                id: item['Mã hợp đồng'] || item['id'],
                client_id: item['Mã khách hàng'] || item['client_id'],
                branch_id: item['Mã chi nhánh'] || item['branch_id'],
                member_name: item['Tên khách hàng'] || item['member_name'],
                phone: item['Số điện thoại'] || item['phone'],
                package_name: item['Gói tập'] || item['package_name'],
                total_amount: item['Tổng tiền'] || item['total_amount'],
                start_date: item['Ngày bắt đầu'] || item['start_date'],
                contract_type: item['Loại hợp đồng'] || item['contract_type'],
                // Add more fields as needed
            }))

            const result = await importContracts(mappedData)
            if (result.success) {
                toast.success(`Đã nhập thành công ${previewData.length} hợp đồng`)
                setOpen(false)
                setPreviewData([])
                onSuccess()
            } else {
                toast.error('Lỗi khi nhập: ' + result.error)
            }
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const downloadTemplate = () => {
        const template = [
            {
                'Mã hợp đồng': 'HD001',
                'Mã khách hàng': 'KH001',
                'Mã chi nhánh': 'CN-LGT',
                'Tên khách hàng': 'Nguyễn Văn A',
                'Số điện thoại': '0901234567',
                'Gói tập': 'VIP 12 Tháng',
                'Tổng tiền': 15000000,
                'Ngày bắt đầu': '2024-03-01',
                'Loại hợp đồng': 'Hội viên'
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'Template_Hợp_Đồng.xlsx')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="rounded-xl text-gray-600 dark:text-gray-300 font-medium h-11 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-600 transition-all border border-gray-100 dark:border-gray-800"
                >
                    <FileUp className="w-4.5 h-4.5 mr-2" />
                    Nhập Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-gray-950">
                <div className="p-8 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-medium flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center text-red-600">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            Nhập Hợp đồng từ Excel
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 py-2">
                            Tải lên file Excel chứa danh sách hợp đồng để nhập nhanh vào hệ thống.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-red-500 transition-all bg-gray-50/50 dark:bg-gray-900 group"
                        >
                            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-3xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileUp className="w-8 h-8 text-gray-400 group-hover:text-red-500" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-gray-900 dark:text-gray-100">Click để chọn file</p>
                                <p className="text-xs text-gray-400 mt-1 font-medium italic">Hỗ trợ .xlsx, .xls</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Chưa có mẫu?</span>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={downloadTemplate}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 tracking-tight"
                            >
                                Tải file mẫu
                            </Button>
                        </div>

                        <AnimatePresence>
                            {previewData.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800"
                                >
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
                                        <span>Dữ liệu xem trước:</span>
                                        <span className="text-red-600">{previewData.length} bản ghi</span>
                                    </p>
                                    <div className="mt-2 text-[10px] text-gray-400 font-medium truncate">
                                        Hợp đồng tiêu biểu: {previewData[0]['Mã hợp đồng'] || previewData[0]['id']} - {previewData[0]['Tên khách hàng'] || previewData[0]['member_name']}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="ghost"
                            className="flex-1 h-12 rounded-2xl font-medium text-gray-400 hover:text-gray-950 dark:hover:text-white"
                            onClick={() => setOpen(false)}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all shadow-lg shadow-red-200 dark:shadow-none disabled:opacity-50"
                            onClick={handleImport}
                            disabled={loading || previewData.length === 0}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xử lý...
                                </div>
                            ) : (
                                'Nhập dữ liệu'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
