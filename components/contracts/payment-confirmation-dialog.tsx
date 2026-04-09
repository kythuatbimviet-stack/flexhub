'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    FileText,
    Loader2,
    Mail,
    Send,
    User,
    CreditCard,
    ClipboardCheck,
    PenTool,
} from 'lucide-react'
import { toast } from 'sonner'
import { sendPaymentConfirmationAction } from '@/app/actions/contracts'
import { format } from 'date-fns'

interface PaymentConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    contract: any
}

export function PaymentConfirmationDialog({
    open,
    onOpenChange,
    contract,
}: PaymentConfirmationDialogProps) {
    const [loading, setLoading] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState('form')
    const [formData, setFormData] = React.useState({
        coso: '',
        ten: '',
        sdt: '',
        email: '',
        diachi: '',
        ngaysinh: '',
        cmnd: '',
        nguon: '',
        goi: '',
        custom: '',
        tien1: '',
        httt1: '',
        tien2: '',
        httt2: '',
        tonggiatri: '',
        hlv: '',
        nbd: '',
        nkt: '',
        ndong: '',
        nguoithu: '',
        ghichu: '',
        custom_message: "Cảm ơn bạn đã tin tưởng và đồng hành cùng Eva's Fit! Hy vọng bạn sẽ có những trải nghiệm tập luyện tuyệt vời nhất.",
    })

    // Auto-fill khi dialog mở / contract thay đổi
    React.useEffect(() => {
        if (open && contract) {
            const safeDate = (val: any) => {
                if (!val) return ''
                try { return format(new Date(val), 'dd/MM/yyyy') } catch { return '' }
            }
            setFormData({
                coso: contract.facility_name || contract.branches?.name || "Eva's Fit Nam Định",
                ten: contract.member_name || contract.clients?.member_name || '',
                sdt: contract.phone || contract.clients?.phone || '',
                email: contract.email || contract.clients?.email || '',
                diachi: contract.member_address || contract.clients?.address || 'Nam Định',
                ngaysinh: safeDate(contract.dob || contract.clients?.dob),
                cmnd: contract.id_number || contract.clients?.id_number || '',
                nguon: contract.source || 'PR',
                goi: contract.package_name || '',
                custom: contract.custom_selection || '',
                tien1: contract.total_amount ? Number(contract.total_amount).toLocaleString('vi-VN') : '',
                httt1: contract.payment_method || 'TM',
                tien2: '',
                httt2: '',
                tonggiatri: contract.total_amount ? Number(contract.total_amount).toLocaleString('vi-VN') : '',
                hlv: contract.trainer_name || '',
                nbd: safeDate(contract.start_date),
                nkt: safeDate(contract.end_date),
                ndong: safeDate(contract.signing_date) || format(new Date(), 'dd/MM/yyyy'),
                nguoithu: contract.created_by_email || '',
                ghichu: contract.payment_notes || '',
                custom_message: "Cảm ơn bạn đã tin tưởng và đồng hành cùng Eva's Fit! Hy vọng bạn sẽ có những trải nghiệm tập luyện tuyệt vời nhất.",
            })
            setActiveTab('form')
        }
    }, [open, contract])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSend = async () => {
        if (!formData.email) {
            toast.error('Vui lòng nhập Email hội viên')
            return
        }
        const isConfirmed = window.confirm(
            `Bạn có muốn gửi xác nhận thanh toán cho email "${formData.email}"?\n\nHệ thống sẽ ghi nhận và gửi email qua webhook trong vài giây.`
        )
        if (!isConfirmed) return

        setLoading(true)
        try {
            const res = await sendPaymentConfirmationAction({ ...formData, contractId: contract.id })
            if (res.success) {
                toast.success('Đã kích hoạt gửi email xác nhận thanh toán! Vui lòng chờ vài giây để email đến hộp thư.')
                onOpenChange(false)
            } else {
                toast.error(res.error || 'Lỗi khi gửi xác nhận')
            }
        } catch (error: any) {
            toast.error('Lỗi hệ thống: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl bg-[#FAF8F5]">
                <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#E8896A] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold text-[#1C1A18] tracking-tight">
                                Xác nhận thanh toán
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium tracking-tight">
                                Tạo biên nhận và gửi email xác nhận cho hội viên
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col mt-4">
                    <div className="px-6 mb-4">
                        <TabsList className="bg-white/50 border border-slate-100 flex gap-1 p-1 rounded-2xl shadow-sm w-fit">
                            <TabsTrigger
                                value="form"
                                className="rounded-xl px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[#993C1D] data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider"
                            >
                                <PenTool className="w-3.5 h-3.5 mr-2" />Nhập liệu
                            </TabsTrigger>
                            <TabsTrigger
                                value="preview"
                                className="rounded-xl px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[#993C1D] data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider"
                            >
                                <FileText className="w-3.5 h-3.5 mr-2" />Xem trước
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        {/* ── TAB: NHẬP LIỆU ── */}
                        <TabsContent value="form" className="m-0 space-y-6">
                            {/* Thông tin hội viên */}
                            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Thông tin hội viên</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <FormGroup label="Cơ sở" name="coso" value={formData.coso} onChange={handleInputChange} />
                                    <FormGroup label="Tên hội viên" name="ten" value={formData.ten} onChange={handleInputChange} />
                                    <FormGroup label="Số điện thoại" name="sdt" value={formData.sdt} onChange={handleInputChange} />
                                    <FormGroup label="Email *" name="email" value={formData.email} onChange={handleInputChange} type="email" required />
                                    <FormGroup label="Địa chỉ" name="diachi" value={formData.diachi} onChange={handleInputChange} />
                                    <FormGroup label="Ngày sinh" name="ngaysinh" value={formData.ngaysinh} onChange={handleInputChange} placeholder="DD/MM/YYYY" />
                                    <FormGroup label="Số CMND/CCCD" name="cmnd" value={formData.cmnd} onChange={handleInputChange} />
                                    <FormGroup label="Nguồn" name="nguon" value={formData.nguon} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Gói tập & Thanh toán */}
                            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <ClipboardCheck className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Gói tập &amp; Thanh toán</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <FormGroup label="Gói tập" name="goi" value={formData.goi} onChange={handleInputChange} />
                                    <FormGroup label="Lựa chọn Custom" name="custom" value={formData.custom} onChange={handleInputChange} />
                                    <FormGroup label="Huấn luyện viên" name="hlv" value={formData.hlv} onChange={handleInputChange} />
                                    <FormGroup label="Số tiền (Lần 1)" name="tien1" value={formData.tien1} onChange={handleInputChange} />
                                    <FormGroup label="Hình thức (Lần 1)" name="httt1" value={formData.httt1} onChange={handleInputChange} />
                                    <FormGroup label="Tổng giá trị HĐ" name="tonggiatri" value={formData.tonggiatri} onChange={handleInputChange} />
                                    <FormGroup label="Số tiền (Lần 2)" name="tien2" value={formData.tien2} onChange={handleInputChange} placeholder="Nếu có" />
                                    <FormGroup label="Hình thức (Lần 2)" name="httt2" value={formData.httt2} onChange={handleInputChange} placeholder="Nếu có" />
                                    <FormGroup label="Người thu" name="nguoithu" value={formData.nguoithu} onChange={handleInputChange} />
                                    <FormGroup label="Ngày bắt đầu" name="nbd" value={formData.nbd} onChange={handleInputChange} />
                                    <FormGroup label="Ngày kết thúc" name="nkt" value={formData.nkt} onChange={handleInputChange} />
                                    <FormGroup label="Ngày đóng tiền" name="ndong" value={formData.ndong} onChange={handleInputChange} />
                                    <div className="col-span-full space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ghi chú</Label>
                                        <Textarea
                                            name="ghichu"
                                            value={formData.ghichu}
                                            onChange={handleInputChange}
                                            className="rounded-2xl border-slate-100 bg-slate-50/50 resize-none min-h-[72px]"
                                            placeholder="Ghi chú thanh toán..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Lời nhắn */}
                            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Lời nhắn gửi kèm email</h3>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Lời nhắn riêng cho khách hàng</Label>
                                    <Textarea
                                        name="custom_message"
                                        value={formData.custom_message}
                                        onChange={handleInputChange}
                                        className="rounded-2xl border-slate-100 bg-slate-50/50 resize-none min-h-[100px]"
                                        placeholder="VD: Chúc bạn có những giờ tập luyện hiệu quả..."
                                    />
                                    <p className="text-[11px] text-slate-400 italic mt-1">Nội dung này sẽ xuất hiện trang trọng ở đầu email gửi cho hội viên.</p>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── TAB: XEM TRƯỚC ── */}
                        <TabsContent value="preview" className="m-0 flex justify-center">
                            <div className="max-w-[620px] w-full bg-white rounded-[24px] shadow-2xl overflow-hidden border border-slate-100">
                                {/* Header */}
                                <div className="p-8 text-center border-b border-slate-50 bg-[#FAF8F5]/50">
                                    <h2 className="text-[28px] font-serif text-[#E8896A] tracking-tight leading-none mb-2">Eva's Fit</h2>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[3px]">Biên nhận thanh toán</p>
                                </div>
                                <div className="p-8 space-y-8">
                                    {/* Receipt Card */}
                                    <div className="bg-[#E8896A] rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-orange-100">
                                        <div>
                                            <h3 className="text-lg font-bold tracking-wide uppercase">BIÊN NHẬN THANH TOÁN</h3>
                                            <p className="text-[11px] opacity-80 font-medium tracking-wider mt-1">CƠ SỞ: {formData.coso}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] opacity-70 font-bold uppercase tracking-widest mb-1">Tổng cộng</div>
                                            <div className="text-2xl font-bold">{formData.tonggiatri || '0'} đ</div>
                                        </div>
                                    </div>
                                    {/* Two Columns */}
                                    <div className="grid grid-cols-2 gap-x-12">
                                        <div className="space-y-6">
                                            <PreviewField label="Tên hội viên" value={formData.ten} color="#1C1A18" />
                                            <PreviewField label="Số điện thoại" value={formData.sdt} color="#1C1A18" />
                                            <PreviewField label="Email" value={formData.email} color="#E8896A" />
                                            <PreviewField label="Địa chỉ" value={formData.diachi} />
                                        </div>
                                        <div className="space-y-6 pl-12 border-l border-slate-100">
                                            <PreviewField label="Gói tập" value={formData.goi} color="#1C1A18" />
                                            <PreviewField label="Huấn luyện viên" value={formData.hlv} />
                                            <PreviewField label="Ngày bắt đầu" value={formData.nbd} />
                                            <PreviewField label="Ngày kết thúc" value={formData.nkt} />
                                        </div>
                                    </div>
                                    {/* Signatures */}
                                    <div className="pt-8 border-t border-slate-50 flex justify-between gap-12">
                                        <div className="flex-1 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-12">Khách hàng ký tên</p>
                                            <div className="border-t border-slate-200 mt-4 pt-3 font-bold text-sm text-slate-700">{formData.ten}</div>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-12">Người thu tiền</p>
                                            <div className="border-t border-slate-200 mt-4 pt-3 font-bold text-sm text-slate-700">{formData.nguoithu}</div>
                                        </div>
                                    </div>
                                    {/* Important Note */}
                                    <div className="bg-[#FAECE7] rounded-2xl p-6 border border-[#F5C4B3]">
                                        <div className="flex items-center gap-2 text-[#993C1D] mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#E8896A]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Lưu ý quan trọng</span>
                                        </div>
                                        <p className="text-[13px] text-slate-700 leading-relaxed italic">
                                            Tất cả các khoản thu đều <b>không hoàn lại</b>. Tiền đặt cọc có giá trị trong vòng <b>14 ngày</b> kể từ ngày thanh toán.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </div>

                    <DialogFooter className="p-6 bg-white border-t border-slate-100 gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-2xl h-12 px-8 font-bold text-slate-400 hover:bg-slate-50"
                        >
                            Đóng
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={loading}
                            className="rounded-2xl h-12 px-10 font-bold bg-[#E8896A] hover:bg-[#993C1D] text-white shadow-xl shadow-orange-100 transition-all active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 mr-3" />
                            )}
                            Gửi xác nhận thanh toán
                        </Button>
                    </DialogFooter>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

function FormGroup({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }: any) {
    return (
        <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-[#E8896A]/20 h-11 text-sm font-medium text-slate-800 transition-all"
            />
        </div>
    )
}

function PreviewField({ label, value, color = '#6B6760' }: any) {
    return (
        <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
            <div className="text-sm font-bold truncate" style={{ color }}>{value || '—'}</div>
        </div>
    )
}
