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
import { importClients } from '@/app/actions/clients'

interface ImportExcelClientDialogProps {
    onSuccess: () => void
}

export function ImportExcelClientDialog({ onSuccess }: ImportExcelClientDialogProps) {
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

                const clientsToInsert = data.map((row: any) => ({
                    id: row['Mã KH'] || row['id'] || `EF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                    member_name: row['Tên hội viên'] || row['member_name'] || '',
                    phone: row['Số điện thoại'] || row['phone'] || '',
                    email: row['Email'] || row['email'] || '',
                    address: row['Địa chỉ'] || row['address'] || '',
                    date_of_birth: row['Ngày sinh'] || row['date_of_birth'] || null,
                    age: row['Tuổi'] || row['age'] ? parseInt(row['Tuổi'] || row['age']) : null,
                    height: row['Chiều cao'] || row['height'] ? parseFloat(row['Chiều cao'] || row['height']) : null,
                    weight: row['Cân nặng'] || row['weight'] ? parseFloat(row['Cân nặng'] || row['weight']) : null,
                    target_weight: row['Mục tiêu cân nặng'] || row['target_weight'] ? parseFloat(row['Mục tiêu cân nặng'] || row['target_weight']) : null,
                    goal: row['Mục tiêu'] || row['goal'] || '',
                    status: row['Trạng thái'] || row['status'] || 'Chốt đăng kí',
                    pt_name: row['Tên PT phụ trách'] || row['pt_name'] || '',
                    assigned_pt: row['PT được gán (Email)'] || row['assigned_pt'] || '',
                    branch_id: row['Mã chi nhánh'] || row['branch_id'] || '',
                    branch_name: row['Tên chi nhánh'] || row['branch_name'] || '',
                    source: row['Nguồn khách'] || row['source'] || '',
                    referrer: row['Người giới thiệu'] || row['referrer'] || '',
                    registration_type: row['Loại đăng ký'] || row['registration_type'] || '',
                    medical_history: row['Tiền sử bệnh lý'] || row['medical_history'] || '',
                    training_time: row['Thời gian tập luyện'] || row['training_time'] || '',
                    notes: row['Ghi chú'] || row['notes'] || '',
                    customer_cycle: row['Chu kỳ khách hàng'] || row['customer_cycle'] || '',
                    zalo_id: row['Zalo ID'] || row['zalo_id'] || '',
                    facebook_id: row['Facebook ID'] || row['facebook_id'] || '',
                    action_log: row['Lịch sử tác động'] || row['action_log'] || '',
                    dob: row['dob'] || row['dob_alt'] || null,
                    signature_url: row['URL chữ ký'] || row['signature_url'] || '',
                    created_by: row['Người tạo (ID)'] || row['created_by'] || '',
                    created_by_email: row['Email người tạo'] || row['created_by_email'] || '',
                }))

                const result = await importClients(clientsToInsert)

                if (!result.success) throw new Error(result.error)

                toast.success(`Đã nhập thành công ${clientsToInsert.length} khách hàng`)
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
                'Mã KH': 'EF-HCM01-2603001',
                'Tên hội viên': 'Nguyễn Văn A',
                'Số điện thoại': '0901234567',
                'Email': 'a@gmail.com',
                'Địa chỉ': '123 Đường ABC, Quận 1, HCM',
                'Ngày sinh': '1995-01-01',
                'Tuổi': 31,
                'Chiều cao': 170,
                'Cân nặng': 70,
                'Mục tiêu cân nặng': 65,
                'Mục tiêu': 'Giảm cân',
                'Trạng thái': 'Chốt đăng kí',
                'Tên PT phụ trách': 'Cao Xuân Hải',
                'PT được gán (Email)': 'coach.hai@evafit.vn',
                'Mã chi nhánh': 'HCM01',
                'Tên chi nhánh': 'Eva\'s Fit Quận 1',
                'Nguồn khách': 'Facebook',
                'Người giới thiệu': '',
                'Loại đăng ký': 'Gói 12 tháng',
                'Tiền sử bệnh lý': 'Không',
                'Thời gian tập luyện': 'Buổi sáng',
                'Ghi chú': 'Hội viên tiềm năng',
                'Chu kỳ khách hàng': 'Mới',
                'Zalo ID': '',
                'Facebook ID': '',
                'Lịch sử tác động': '',
                'dob': '1995-01-01',
                'URL chữ ký': '',
                'Người tạo (ID)': '',
                'Email người tạo': '',
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'eva_fit_client_template.xlsx')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all font-medium h-11 px-4">
                    <FileUp className="w-4 h-4 mr-2" />
                    Nhập Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-8">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">Nhập liệu hàng loạt</DialogTitle>
                    <DialogDescription className="text-gray-500 text-sm">
                        Tải lên file Excel mẫu của Eva's Fit để cập nhật danh sách hội viên nhanh chóng.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-8">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl p-12 bg-gray-50/30 hover:bg-red-50/30 transition-all cursor-pointer group relative overflow-hidden">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        <div className="relative z-0 flex flex-col items-center">
                            {isUploading ? (
                                <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
                            ) : (
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <FileUp className="h-8 w-8 text-red-600" />
                                </div>
                            )}
                            <p className="mt-4 text-sm font-bold text-gray-700">
                                {isUploading ? 'Đang tải lên...' : 'Chọn file Excel'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">Kéo thả file vào đây</p>
                        </div>
                    </div>

                    <div className="mt-8 p-5 bg-gray-50/50 rounded-2xl border border-gray-50 flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <Download className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">Mẫu nhập liệu</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Hãy sử dụng đúng định dạng của Eva's Fit để tránh lỗi dữ liệu.</p>
                            <Button
                                variant="link"
                                className="p-0 h-auto text-red-600 text-xs font-bold mt-2 hover:no-underline"
                                onClick={downloadTemplate}
                            >
                                Tải xuống file mẫu (.xlsx)
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="rounded-xl font-semibold text-gray-400"
                    >
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
