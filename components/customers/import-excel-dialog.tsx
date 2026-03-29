'use client'

import * as React from 'react'
import { FileUp, Loader2, Download } from 'lucide-react'
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
import { toast } from 'sonner'
import { importCustomers } from '@/app/actions/customers'

interface ImportExcelDialogProps {
    onSuccess: () => void
}

export function ImportExcelDialog({ onSuccess }: ImportExcelDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const reader = new FileReader()

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)

                if (data.length === 0) {
                    toast.error('File Excel không có dữ liệu')
                    setIsUploading(false)
                    return
                }

                const customersToInsert = data.map((row: any) => ({
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
                }))

                const result = await importCustomers(customersToInsert)

                if (!result.success) throw new Error(result.error)

                toast.success(`Đã nhập thành công ${customersToInsert.length} khách hàng`)
                setOpen(false)
                onSuccess()
            } catch (error: any) {
                console.error('Import error:', error)
                toast.error('Lỗi khi nhập dữ liệu từ Excel: ' + error.message)
            } finally {
                setIsUploading(false)
            }
        }

        reader.readAsBinaryString(file)
    }

    const downloadTemplate = () => {
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
                'Ngày tạo': new Date().toLocaleDateString('vi-VN')
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'customer_template.xlsx')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all font-medium h-11 px-3 sm:px-4">
                    <FileUp className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Nhập Excel</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl bg-white dark:bg-gray-950 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Nhập khách hàng từ Excel</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Tải lên file Excel (.xlsx, .xls) chứa danh sách khách hàng.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl p-10 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/80 transition-colors cursor-pointer group relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        {isUploading ? (
                            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                        ) : (
                            <FileUp className="h-10 w-10 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                        )}
                        <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {isUploading ? 'Đang xử lý...' : 'Chọn file hoặc kéo thả vào đây'}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Hỗ trợ .xlsx, .xls</p>
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
                        onClick={() => setOpen(false)}
                        className="rounded-xl font-semibold text-gray-500 dark:text-gray-400"
                    >
                        Hủy bỏ
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
