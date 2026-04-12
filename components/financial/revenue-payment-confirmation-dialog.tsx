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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
import { useQuery } from '@tanstack/react-query'
import { fetchUsers } from '@/app/actions/users'
import { fetchContractById, sendPaymentConfirmationAction } from '@/app/actions/contracts'
import { format } from 'date-fns'

interface RevenuePaymentConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    revenue: any
}

export function RevenuePaymentConfirmationDialog({
    open,
    onOpenChange,
    revenue,
}: RevenuePaymentConfirmationDialogProps) {
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

    const { data: users = [] } = useQuery({
        queryKey: ['users-all'],
        queryFn: async () => {
            const res = await fetchUsers()
            return res.success ? (res.data ?? []) : []
        },
        enabled: open,
    })

    // Auto-fill logic
    React.useEffect(() => {
        const fillData = async () => {
            if (open && revenue) {
                const safeDate = (val: any) => {
                    if (!val) return '—'
                    try { return format(new Date(val), 'dd/MM/yyyy') } catch { return '—' }
                }

                // Nếu có contract_id, fetch thêm thông tin contract để điền gói tập, HLV
                let contractInfo = null
                if (revenue.contract_id) {
                    const res = await fetchContractById(revenue.contract_id)
                    if (res.success) contractInfo = res.data
                }

                const collector = users.find((u: any) => u.email === revenue.created_by_email)
                const collectorName = collector?.name || revenue.created_by_email || ''

                setFormData({
                    coso: revenue.branches?.name || contractInfo?.branches?.name || "Eva's Fit",
                    ten: revenue.clients?.member_name || contractInfo?.member_name || 'Khách hàng',
                    sdt: revenue.clients?.phone || contractInfo?.phone || '',
                    email: revenue.clients?.email || contractInfo?.email || '',
                    diachi: revenue.clients?.address || contractInfo?.member_address || '',
                    ngaysinh: safeDate(revenue.clients?.dob || contractInfo?.dob),
                    cmnd: revenue.clients?.id_number || contractInfo?.id_number || '',
                    nguon: contractInfo?.source || 'Vãng lai',
                    goi: contractInfo?.package_name || revenue.category_id || 'Dịch vụ',
                    custom: contractInfo?.custom_selection || '',
                    tien1: Number(revenue.amount).toLocaleString('vi-VN'),
                    httt1: revenue.payment_method || 'Tiền mặt',
                    tien2: '',
                    httt2: '',
                    tonggiatri: Number(revenue.amount).toLocaleString('vi-VN'),
                    hlv: contractInfo?.trainer_name || '',
                    nbd: safeDate(contractInfo?.start_date),
                    nkt: safeDate(contractInfo?.end_date),
                    ndong: safeDate(revenue.recorded_at) || format(new Date(), 'dd/MM/yyyy'),
                    nguoithu: contractInfo?.trainer_name || collectorName,
                    ghichu: revenue.description || '',
                    custom_message: "Cảm ơn bạn đã tin tưởng và đồng hành cùng Eva's Fit! Hy vọng bạn sẽ có những trải nghiệm tập luyện tuyệt vời nhất.",
                })
                setActiveTab('form')
            }
        }
        fillData()
    }, [open, revenue, users])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSend = async () => {
        if (!formData.email) {
            toast.error('Vui lòng nhập Email khách hàng')
            return
        }

        setLoading(true)
        try {
            const res = await sendPaymentConfirmationAction({
                ...formData,
                contractId: revenue.contract_id || 'REV_' + revenue.id,
                clientId: revenue.customer_id,
                revenueId: revenue.id
            })
            if (res.success) {
                toast.success('Đã gửi email xác nhận thanh toán!')
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
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold text-[#1C1A18] tracking-tight">
                                Xác nhận thanh toán (Doanh thu)
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium tracking-tight">
                                Kiểm tra thông tin trước khi gửi email cho khách hàng
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col mt-4">
                    <div className="px-6 mb-4">
                        <TabsList className="bg-white/50 border border-slate-100 flex gap-1 p-1 rounded-2xl shadow-sm w-fit">
                            <TabsTrigger
                                value="form"
                                className="rounded-xl px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                <PenTool className="w-3.5 h-3.5 mr-2" />Nhập liệu
                            </TabsTrigger>
                            <TabsTrigger
                                value="preview"
                                className="rounded-xl px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                <FileText className="w-3.5 h-3.5 mr-2" />Xem trước
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <TabsContent value="form" className="m-0 space-y-6">
                            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                                    <div className="w-8 h-8 rounded-xl bg-[#F0F0F0] flex items-center justify-center text-black">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-medium text-[15px] text-black tracking-tight">HỘI VIÊN</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <FormGroup label="Cơ sở" name="coso" value={formData.coso} onChange={handleInputChange} />
                                    <FormGroup label="Tên hội viên" name="ten" value={formData.ten} onChange={handleInputChange} />
                                    <FormGroup label="Số điện thoại" name="sdt" value={formData.sdt} onChange={handleInputChange} />
                                    <FormGroup label="Email nhận *" name="email" value={formData.email} onChange={handleInputChange} type="email" required />
                                    <FormGroup label="Địa chỉ" name="diachi" value={formData.diachi} onChange={handleInputChange} />
                                    <FormGroup label="Ngày sinh" name="ngaysinh" value={formData.ngaysinh} onChange={handleInputChange} />
                                    <FormGroup label="Số CMND/CCCD" name="cmnd" value={formData.cmnd} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* THẺ 2: DỊCH VỤ & GÓI TẬP */}
                            <div className="bg-white rounded-[28px] p-7 border border-[#F2F2F2] shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-[#F9F9F9]">
                                    <div className="w-8 h-8 rounded-xl bg-[#F0F0F0] flex items-center justify-center text-black">
                                        <ClipboardCheck className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-medium text-[15px] text-black tracking-tight">HỢP ĐỒNG</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <FormGroup label="Gói tập" name="goi" value={formData.goi} onChange={handleInputChange} />
                                    <FormGroup label="Tổng giá trị hợp đồng" name="tonggiatri" value={formData.tonggiatri} onChange={handleInputChange} />
                                    <FormGroup label="Huấn luyện viên" name="hlv" value={formData.hlv} onChange={handleInputChange} />
                                    <FormGroup label="Ngày bắt đầu" name="nbd" value={formData.nbd} onChange={handleInputChange} />
                                    <FormGroup label="Ngày kết thúc" name="nkt" value={formData.nkt} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* THẺ 3: CHI TIẾT THANH TOÁN & XÁC NHẬN */}
                            <div className="bg-white rounded-[28px] p-7 border border-[#F2F2F2] shadow-sm space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-[#F9F9F9]">
                                    <div className="w-8 h-8 rounded-xl bg-[#F0F0F0] flex items-center justify-center text-black">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-medium text-[15px] text-black tracking-tight">XÁC NHẬN THANH TOÁN</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="col-span-full space-y-2">
                                        <Label className="text-[13px] font-medium text-black pl-1">Nội dung xác nhận (Lời cảm ơn / Ghi chú)</Label>
                                        <Textarea
                                            name="ghichu"
                                            value={formData.ghichu}
                                            onChange={handleInputChange}
                                            className="rounded-2xl border-[#EFEFEF] bg-[#FBFBFB] focus:bg-white focus:ring-1 focus:ring-black focus:border-black resize-none min-h-[85px] text-[15px] text-black font-medium transition-all"
                                            placeholder="VD: Cảm ơn bạn đã đóng tiền trả trước cho HĐ..."
                                        />
                                    </div>
                                    <FormGroup label="Số tiền thanh toán" name="tien1" value={formData.tien1} onChange={handleInputChange} />
                                    <SelectGroup
                                        label="Hình thức thanh toán"
                                        value={formData.httt1}
                                        onChange={(val: string) => setFormData(p => ({ ...p, httt1: val }))}
                                        options={[
                                            { label: 'Tiền mặt', value: 'Tiền mặt' },
                                            { label: 'Chuyển khoản', value: 'Chuyển khoản' },
                                            { label: 'Quẹt thẻ', value: 'Quẹt thẻ' },
                                        ]}
                                    />
                                    <SelectGroup
                                        label="Người thu tiền"
                                        value={formData.nguoithu}
                                        onChange={(val: string) => setFormData(p => ({ ...p, nguoithu: val }))}
                                        options={users.map((u: any) => ({ label: u.name || u.email, value: u.name || u.email }))}
                                    />
                                    <FormGroup label="Ngày thực hiện thu" name="ndong" value={formData.ndong} onChange={handleInputChange} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="m-0 flex justify-center">
                            <div className="max-w-[620px] w-full bg-white rounded-[24px] shadow-2xl overflow-hidden border border-slate-100">
                                <div className="p-10 text-center border-b border-[#F2F2F2] bg-[#FBFBFB]">
                                    <h2 className="text-[32px] font-serif text-[#10B981] tracking-tight leading-none mb-3">Eva's Fit</h2>
                                    <p className="text-[12px] font-medium text-black tracking-[4px] opacity-40">BIÊN NHẬN THANH TOÁN</p>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="bg-[#10B981] rounded-3xl p-7 text-white flex justify-between items-center shadow-xl shadow-emerald-50">
                                        <div>
                                            <h3 className="text-xl font-medium tracking-tight">XÁC NHẬN THANH TOÁN</h3>
                                            <p className="text-[12px] opacity-80 font-medium tracking-wide mt-1">CƠ SỞ: {formData.coso}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] opacity-70 font-medium tracking-widest mb-1">Số tiền thanh toán</div>
                                            <div className="text-[28px] font-medium">{formData.tien1 || '0'} đ</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-12">
                                        <div className="space-y-6">
                                            <PreviewField label="Tên hội viên" value={formData.ten} color="#1C1A18" />
                                            <PreviewField label="Số điện thoại" value={formData.sdt} color="#1C1A18" />
                                            <PreviewField label="Email nhận" value={formData.email} color="rgb(16, 185, 129)" />
                                            <PreviewField label="Địa chỉ" value={formData.diachi} />
                                        </div>
                                        <div className="space-y-6 pl-12 border-l border-slate-100">
                                            <PreviewField label="Dịch vụ / Gói tập" value={formData.goi} color="#1C1A18" />
                                            <PreviewField label="Người thu" value={formData.nguoithu} />
                                            <PreviewField label="Ngày thanh toán" value={formData.ndong} />
                                            <PreviewField label="Hình thức" value={formData.httt1} />
                                        </div>
                                    </div>
                                    <div className="bg-[#F2F9F7] rounded-3xl p-7 border border-[#E1F2ED] space-y-5">
                                        {formData.ghichu && (
                                            <div className="flex flex-col gap-2 pb-4 border-b border-emerald-100/50">
                                                <span className="text-[11px] font-medium text-emerald-700/60 uppercase tracking-widest">Nội dung xác nhận:</span>
                                                <span className="text-[15px] text-black font-medium leading-relaxed italic">"{formData.ghichu}"</span>
                                            </div>
                                        )}
                                        <p className="text-[14px] text-black/70 font-medium leading-relaxed">
                                            Cảm ơn quý khách đã tin dùng dịch vụ tại Eva's Fit. <br />
                                            Lưu ý: Tất cả các khoản thu đều <b>không hoàn lại</b>.
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
                            className="rounded-2xl h-12 px-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100 transition-all active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 mr-3" />
                            )}
                            Gửi ngay cho hội viên
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
            <Label className="text-[13px] font-medium text-black pl-1">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="rounded-2xl border-[#EFEFEF] bg-[#FBFBFB] focus:bg-white focus:ring-1 focus:ring-black focus:border-black h-12 text-[15px] font-medium text-black transition-all"
            />
        </div>
    )
}

function SelectGroup({ label, value, onChange, options, required = false }: any) {
    return (
        <div className="space-y-2">
            <Label className="text-[13px] font-medium text-black pl-1">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="rounded-2xl border-[#EFEFEF] bg-[#FBFBFB] focus:bg-white focus:ring-1 focus:ring-black focus:border-black h-12 text-[15px] font-medium text-black transition-all">
                    <SelectValue placeholder={`Chọn...`} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-[#EFEFEF] shadow-2xl">
                    {options.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-[15px] font-medium rounded-xl m-1 py-3">
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

function PreviewField({ label, value, color = '#000000' }: any) {
    return (
        <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-[#A0A0A0]">{label}</div>
            <div className="text-[15px] font-medium truncate" style={{ color }}>{value || '—'}</div>
        </div>
    )
}
