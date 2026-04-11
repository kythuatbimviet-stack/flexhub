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
                    nguoithu: collectorName,
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
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Thông tin hội viên</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <FormGroup label="Cơ sở" name="coso" value={formData.coso} onChange={handleInputChange} />
                                    <FormGroup label="Tên hội viên" name="ten" value={formData.ten} onChange={handleInputChange} />
                                    <FormGroup label="Số điện thoại" name="sdt" value={formData.sdt} onChange={handleInputChange} />
                                    <FormGroup label="Email nhận *" name="email" value={formData.email} onChange={handleInputChange} type="email" required />
                                    <FormGroup label="Địa chỉ" name="diachi" value={formData.diachi} onChange={handleInputChange} />
                                    <FormGroup label="Ngày sinh" name="ngaysinh" value={formData.ngaysinh} onChange={handleInputChange} />
                                    <FormGroup label="Số CMND/CCCD" name="cmnd" value={formData.cmnd} onChange={handleInputChange} />
                                    <FormGroup label="Nguồn" name="nguon" value={formData.nguon} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <ClipboardCheck className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Khoản thu &amp; Dịch vụ</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <FormGroup label="Dịch vụ / Gói tập" name="goi" value={formData.goi} onChange={handleInputChange} />
                                    <FormGroup label="Số tiền đóng" name="tien1" value={formData.tien1} onChange={handleInputChange} />
                                    <FormGroup label="Hình thức" name="httt1" value={formData.httt1} onChange={handleInputChange} />
                                    <FormGroup label="Tổng giá trị" name="tonggiatri" value={formData.tonggiatri} onChange={handleInputChange} />
                                    <FormGroup label="Huấn luyện viên" name="hlv" value={formData.hlv} onChange={handleInputChange} />
                                    <FormGroup label="Ngày đóng tiền" name="ndong" value={formData.ndong} onChange={handleInputChange} />
                                    <FormGroup label="Người thu" name="nguoithu" value={formData.nguoithu} onChange={handleInputChange} />
                                    <div className="col-span-full space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ghi chú giao dịch</Label>
                                        <Textarea
                                            name="ghichu"
                                            value={formData.ghichu}
                                            onChange={handleInputChange}
                                            className="rounded-2xl border-slate-100 bg-slate-50/50 resize-none min-h-[72px] text-sm"
                                            placeholder="Ghi chú..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="m-0 flex justify-center">
                            <div className="max-w-[620px] w-full bg-white rounded-[24px] shadow-2xl overflow-hidden border border-slate-100">
                                <div className="p-8 text-center border-b border-slate-50 bg-[#FAF8F5]/50">
                                    <h2 className="text-[28px] font-serif text-emerald-600 tracking-tight leading-none mb-2">Eva's Fit</h2>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[3px]">Biên nhận thanh toán</p>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="bg-emerald-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-emerald-100">
                                        <div>
                                            <h3 className="text-lg font-bold tracking-wide uppercase">XÁC NHẬN THANH TOÁN</h3>
                                            <p className="text-[11px] opacity-80 font-medium tracking-wider mt-1 uppercase">CƠ SỞ: {formData.coso}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] opacity-70 font-bold uppercase tracking-widest mb-1">Số tiền đóng</div>
                                            <div className="text-2xl font-bold">{formData.tien1 || '0'} đ</div>
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
                                    <div className="bg-[#E7F3EF] rounded-2xl p-6 border border-emerald-100">
                                        <p className="text-[13px] text-slate-700 leading-relaxed italic">
                                            Cảm ơn quý khách đã tin dùng dịch vụ tại Eva's Fit. <br/>
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
            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white h-11 text-sm font-medium text-slate-800 transition-all"
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
