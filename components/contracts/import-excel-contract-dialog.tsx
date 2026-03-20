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
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true })
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
                member_name: item['Hội viên'] || item['member_name'],
                phone: item['Số điện thoại'] || item['phone'],
                email: item['Email'] || item['email'],
                dob: item['Ngày sinh'] || item['Ngày sinh (dob)'] || item['Ngày sinh (birth)'] || item['dob'] || item['date_of_birth'],
                id_number: item['Số CMND/CCCD'] || item['id_number'],
                member_address: item['Địa chỉ hội viên'] || item['member_address'],
                status: item['Trạng thái'] || item['status'],
                branch_id: item['Mã chi nhánh'] || item['branch_id'],
                facility_name: item['Tên cơ sở'] || item['Chi nhánh'] || item['facility_name'],
                short_name: item['Tên viết tắt'] || item['short_name'],
                address: item['Địa chỉ cơ sở'] || item['address'],
                center_phone: item['Hotline trung tâm'] || item['center_phone'],
                contract_type: item['Loại hợp đồng'] || item['contract_type'],
                contract_name: item['Tên hợp đồng'] || item['contract_name'],
                signing_date: item['Ngày ký'] || item['signing_date'],
                start_date: item['Ngày bắt đầu'] || item['start_date'],
                end_date: item['Ngày kết thúc'] || item['end_date'],
                package_duration: item['Thời hạn gói (tháng)'] || item['package_duration'],
                total_days: item['Tổng số ngày'] || item['total_days'],
                source: item['Nguồn khách'] || item['source'],
                legal_representative: item['Đại diện pháp luật'] || item['legal_representative'],
                representative_phone: item['SĐT đại diện'] || item['representative_phone'],
                initial_height: item['Chiều cao ban đầu'] || item['initial_height'],
                initial_weight: item['Cân nặng ban đầu'] || item['initial_weight'],
                target_weight: item['Cân nặng mục tiêu'] || item['target_weight'],
                final_weight: item['Cân nặng cuối cùng'] || item['final_weight'],
                weight_change: item['Thay đổi cân nặng'] || item['weight_change'],
                medical_conditions: item['Tình trạng sức khỏe'] || item['medical_conditions'],
                medical_condition: item['Tình trạng bệnh lý'] || item['medical_condition'],
                membership_id: item['Mã gói tập'] || item['membership_id'],
                package_name: item['Tên gói tập'] || item['package_name'],
                package_type: item['Loại gói tập'] || item['package_type'],
                quantity: item['Số lượng'] || item['quantity'],
                package_price: item['Giá niêm yết'] || item['package_price'],
                package_price_text: item['Giá niêm yết (chữ)'] || item['package_price_text'],
                price_before_discount: item['Giá trước giảm'] || item['price_before_discount'],
                discounted_price: item['Giá sau giảm'] || item['discounted_price'],
                discounted_price_text: item['Giá sau giảm (chữ)'] || item['discounted_price_text'],
                total_amount: item['Tổng tiền'] || item['total_amount'],
                total_amount_text: item['Tổng tiền (chữ)'] || item['total_amount_text'],
                custom_selection: item['Lựa chọn tùy chỉnh'] || item['custom_selection'],
                trainer_type: item['Loại PT'] || item['trainer_type'],
                total_sessions: item['Tổng số buổi'] || item['total_sessions'],
                trainer_name: item['Tên PT'] || item['trainer_name'],
                trainer_phone: item['SĐT PT'] || item['trainer_phone'],
                assigned_pt: item['PT được chỉ định'] || item['assigned_pt'],
                center_representative: item['Đại diện trung tâm'] || item['center_representative'],
                representative_name: item['Tên người đại diện'] || item['representative_name'],
                staff_phone: item['SĐT nhân viên'] || item['staff_phone'],
                payment_method: item['Phương thức thanh toán'] || item['payment_method'],
                payment_installment: item['Số kỳ thanh toán'] || item['payment_installment'],
                account_number: item['Số tài khoản'] || item['account_number'],
                account_holder: item['Chủ tài khoản'] || item['account_holder'],
                bank_name: item['Tên ngân hàng'] || item['bank_name'],
                payment_notes: item['Ghi chú thanh toán'] || item['payment_notes'],
                qr_payment_url: item['Link QR'] || item['qr_payment_url'],
                contract_file_url: item['Link file HĐ'] || item['contract_file_url'],
                contract_file_name: item['Tên file HĐ'] || item['contract_file_name'],
                photo_1_url: item['Ảnh 1'] || item['photo_1_url'],
                photo_2_url: item['Ảnh 2'] || item['photo_2_url'],
                month: item['Tháng'] || item['month'],
                day: item['Ngày'] || item['day'],
                signature_url: item['Chữ ký hội viên'] || item['signature_url'],
                signature_center: item['Chữ ký trung tâm'] || item['signature_center'],
                sendzalo: item['Gửi Zalo'] || item['sendzalo'],
                sendemail: item['Gửi Email'] || item['sendemail'],
                created_by: item['Người tạo (ID)'] || item['created_by'],
                created_by_email: item['Email người tạo'] || item['created_by_email'],
                created_at: item['Ngày tạo hệ thống'] || item['created_at'],
                updated_at: item['Cập nhật cuối'] || item['updated_at'],
                action_log: item['Nhật ký hoạt động'] || item['action_log'],
                center_address: item['Địa chỉ trung tâm'] || item['center_address'],
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
                'Mã hợp đồng': 'HD-LGT-2603001',
                'Mã khách hàng': 'KH001',
                'Hội viên': 'Nguyễn Văn A',
                'Số điện thoại': '0901234567',
                'Email': 'vana@gmail.com',
                'Ngày sinh': '1990-01-01',
                'Số CMND/CCCD': '0123456789',
                'Địa chỉ hội viên': '123 Đường ABC, Quận 1, HCM',
                'Trạng thái': 'Chờ ký HĐ',
                'Mã chi nhánh': 'LGT',
                'Chi nhánh': 'Eva\'s Fit Lê Gia Định',
                'Loại hợp đồng': 'Hội viên',
                'Tên hợp đồng': 'Hợp đồng dịch vụ hội viên',
                'Ngày ký': '2026-03-01',
                'Ngày bắt đầu': '2026-03-01',
                'Ngày kết thúc': '2027-03-01',
                'Thời hạn gói (tháng)': 12,
                'Tên gói tập': 'VIP 12 Tháng',
                'Số lượng': 1,
                'Giá niêm yết': 15000000,
                'Tổng tiền': 15000000,
                'Phương thức thanh toán': 'Chuyển khoản',
                'Tên PT': 'Trần Văn B',
                'Ghi chú thanh toán': 'Đã thanh toán đủ'
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
                    className="rounded-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 h-11 w-11 p-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                    <FileUp className="w-5 h-5" />
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
