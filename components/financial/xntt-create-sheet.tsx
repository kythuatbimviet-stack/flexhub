'use client'

import * as React from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
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
import { useQuery } from '@tanstack/react-query'
import { fetchUsers } from '@/app/actions/users'
import { fetchClients } from '@/app/actions/clients'
import { fetchContractsLite, sendPaymentConfirmationAction } from '@/app/actions/contracts'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2, Mail, Send, User, CreditCard, ClipboardCheck, PenTool, Plus, Check, FileText, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface XnttCreateSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function XnttCreateSheet({
    open,
    onOpenChange,
    onSuccess,
}: XnttCreateSheetProps) {
    const [loading, setLoading] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState('form')
    const [selectedClientId, setSelectedClientId] = React.useState<string>('')
    const [selectedContractId, setSelectedContractId] = React.useState<string>('')
    const [expandedGroups, setExpandedGroups] = React.useState({
        selection: true,
        details: false,
        payment: false,
    })

    const toggleGroup = (group: keyof typeof expandedGroups) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
    }

    const [formData, setFormData] = React.useState({
        coso: "Eva's Fit",
        ten: '',
        sdt: '',
        email: '',
        diachi: '',
        ngaysinh: '',
        cmnd: '',
        nguon: 'Vãng lai',
        goi: '',
        custom: '',
        tien1: '',
        httt1: 'Tiền mặt',
        tien2: '',
        httt2: '',
        tonggiatri: '',
        hlv: '',
        nbd: '',
        nkt: '',
        ndong: format(new Date(), 'dd/MM/yyyy'),
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

    const { data: clientsData = [] } = useQuery({
        queryKey: ['clients-all-xntt'],
        queryFn: async () => {
            const res = await fetchClients()
            return res.success ? (res.data ?? []) : []
        },
        enabled: open,
    })

    const { data: contractsData = [] } = useQuery({
        queryKey: ['contracts-all-xntt'],
        queryFn: async () => {
            const res = await fetchContractsLite()
            return res.success ? (res.data ?? []) : []
        },
        enabled: open,
    })

    const filteredContracts = React.useMemo(() => {
        if (!selectedClientId) return []
        return contractsData.filter((c: any) => c.client_id === selectedClientId)
    }, [selectedClientId, contractsData])

    // Auto-fill client info
    React.useEffect(() => {
        if (selectedClientId) {
            const client = clientsData.find((c: any) => c.id === selectedClientId)
            if (client) {
                setFormData(prev => ({
                    ...prev,
                    ten: client.member_name || '',
                    sdt: client.phone || '',
                    email: client.email || '',
                    diachi: client.address || '',
                    cmnd: client.id_number || '',
                    ngaysinh: client.dob ? format(new Date(client.dob), 'dd/MM/yyyy') : '',
                }))
                setSelectedContractId('') // Reset contract when client changes
            }
        }
    }, [selectedClientId, clientsData])

    // Auto-fill contract info
    React.useEffect(() => {
        if (selectedContractId) {
            const contract = contractsData.find((c: any) => c.id === selectedContractId)
            if (contract) {
                setFormData(prev => ({
                    ...prev,
                    goi: contract.package_name || '',
                    cmnd: contract.id_number || '',
                    hlv: contract.trainer_name || '',
                    nbd: contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '',
                    nkt: contract.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : '',
                    tonggiatri: Number(contract.total_amount || 0).toLocaleString('vi-VN'),
                    tien1: Number(contract.total_amount || 0).toLocaleString('vi-VN'),
                    httt1: contract.payment_method || 'Tiền mặt',
                    nguoithu: contract.trainer_name || '',
                }))
            }
        }
    }, [selectedContractId, contractsData])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSend = async () => {
        if (!formData.email) {
            toast.error('Vui lòng nhập Email khách hàng')
            return
        }
        if (!formData.ten) {
            toast.error('Vui lòng nhập Tên Học viên')
            return
        }

        setLoading(true)
        try {
            const res = await sendPaymentConfirmationAction({
                ...formData,
                clientId: selectedClientId,
                contractId: selectedContractId || 'MANUAL_' + Date.now(),
            })
            if (res.success) {
                toast.success('Đã gửi email xác nhận thanh toán!')
                onOpenChange(false)
                onSuccess?.()
                // Reset form
                setSelectedClientId('')
                setSelectedContractId('')
                setFormData({
                    coso: "Eva's Fit",
                    ten: '',
                    sdt: '',
                    email: '',
                    diachi: '',
                    ngaysinh: '',
                    cmnd: '',
                    nguon: 'Vãng lai',
                    goi: '',
                    custom: '',
                    tien1: '',
                    httt1: 'Tiền mặt',
                    tien2: '',
                    httt2: '',
                    tonggiatri: '',
                    hlv: '',
                    nbd: '',
                    nkt: '',
                    ndong: format(new Date(), 'dd/MM/yyyy'),
                    nguoithu: '',
                    ghichu: '',
                    custom_message: "Cảm ơn bạn đã tin tưởng và đồng hành cùng Eva's Fit! Hy vọng bạn sẽ có những trải nghiệm tập luyện tuyệt vời nhất.",
                })
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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[700px] p-0 border-none shadow-2xl bg-[#FAF8F5] flex flex-col h-screen overflow-hidden font-inter">
                <SheetHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-medium text-black tracking-tight">Thêm Xác nhận thanh toán mới</SheetTitle>
                            <SheetDescription className="text-slate-500 font-medium tracking-tight">Nhập thông tin để gửi email biên nhận cho khách hàng</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="px-8 mb-6">
                        <TabsList className="bg-white border border-[#F2F2F2] flex gap-1 p-1 rounded-2xl shadow-sm w-fit">
                            <TabsTrigger
                                value="form"
                                className="rounded-xl px-6 py-2.5 data-[state=active]:bg-black data-[state=active]:text-white font-medium text-[13px] transition-all"
                            >
                                <PenTool className="w-3.5 h-3.5 mr-2" />Nhập liệu
                            </TabsTrigger>
                            <TabsTrigger
                                value="preview"
                                className="rounded-xl px-6 py-2.5 data-[state=active]:bg-black data-[state=active]:text-white font-medium text-[13px] transition-all"
                            >
                                <FileText className="w-3.5 h-3.5 mr-2" />Xem trước
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 min-h-0 w-full" type="always">
                        <div className="px-8 pb-8">
                            <TabsContent value="form" className="m-0 space-y-8">
                            <div className="bg-white rounded-[32px] border border-[#F2F2F2] shadow-sm overflow-hidden mt-4">
                                <button 
                                    onClick={() => toggleGroup('selection')}
                                    className="w-full flex items-center justify-between p-8 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-medium text-[15px] text-black tracking-tight uppercase">Chọn đối tượng gửi</h3>
                                    </div>
                                    <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", expandedGroups.selection && "rotate-180")} />
                                </button>
                                
                                <AnimatePresence initial={false}>
                                    {expandedGroups.selection && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-8 pb-8 pt-0 flex flex-col gap-6 border-t border-[#F9F9F9]">
                                                <div className="mt-6" /> {/* Spacer */}
                                                <SelectGroup
                                                    label="Học viên (Chọn để tự điền)"
                                                    value={selectedClientId}
                                                    onChange={setSelectedClientId}
                                                    options={clientsData.map((c: any) => ({
                                                        label: `${c.member_name} - ${c.phone || ''}`,
                                                        value: c.id
                                                    }))}
                                                    required
                                                    className="w-[450px]"
                                                />
                                                <SelectGroup
                                                    label="Hợp đồng (Chọn để tự điền)"
                                                    value={selectedContractId}
                                                    onChange={setSelectedContractId}
                                                    options={filteredContracts.map((c: any) => ({
                                                        label: `${c.package_name} (${format(new Date(c.start_date), 'dd/MM/yyyy')})`,
                                                        value: c.id
                                                    }))}
                                                    disabled={!selectedClientId}
                                                    className="w-[450px]"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {selectedClientId && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* THÔNG TIN CHI TIẾT */}
                                    <div className="bg-white rounded-[32px] border border-[#F2F2F2] shadow-sm overflow-hidden mt-6">
                                        <button 
                                            onClick={() => toggleGroup('details')}
                                            className="w-full flex items-center justify-between p-8 hover:bg-slate-50/50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-[#F0F0F0] flex items-center justify-center text-black">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <h3 className="font-medium text-[15px] text-black tracking-tight uppercase">Thông tin chi tiết</h3>
                                            </div>
                                            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", expandedGroups.details && "rotate-180")} />
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {expandedGroups.details && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                >
                                                    <div className="px-8 pb-8 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-t border-[#F9F9F9]">
                                                        <div className="mt-6 col-span-full" />
                                                        <FormGroup label="Tên Học viên" name="ten" value={formData.ten} onChange={handleInputChange} />
                                                        <FormGroup label="Email nhận" name="email" value={formData.email} onChange={handleInputChange} type="email" />
                                                        <FormGroup label="Số điện thoại" name="sdt" value={formData.sdt} onChange={handleInputChange} />
                                                        <FormGroup label="Gói tập" name="goi" value={formData.goi} onChange={handleInputChange} />
                                                        <FormGroup label="Huấn luyện viên" name="hlv" value={formData.hlv} onChange={handleInputChange} />
                                                        <FormGroup label="Tổng giá trị" name="tonggiatri" value={formData.tonggiatri} onChange={handleInputChange} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* XÁC NHẬN THANH TOÁN */}
                                    <div className="bg-white rounded-[32px] border border-[#F2F2F2] shadow-sm overflow-hidden">
                                        <button 
                                            onClick={() => toggleGroup('payment')}
                                            className="w-full flex items-center justify-between p-8 hover:bg-slate-50/50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-[#F0F0F0] flex items-center justify-center text-black">
                                                    <CreditCard className="w-4 h-4" />
                                                </div>
                                                <h3 className="font-medium text-[15px] text-black tracking-tight uppercase">Xác nhận thanh toán</h3>
                                            </div>
                                            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", expandedGroups.payment && "rotate-180")} />
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {expandedGroups.payment && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                >
                                                    <div className="px-8 pb-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#F9F9F9]">
                                                        <div className="mt-6 col-span-full" />
                                                        <div className="col-span-full space-y-2">
                                                            <Label className="text-[13px] font-medium text-black pl-1">Nội dung xác nhận</Label>
                                                            <Textarea
                                                                name="ghichu"
                                                                value={formData.ghichu}
                                                                onChange={handleInputChange}
                                                                className="rounded-2xl border-[#EFEFEF] bg-[#FBFBFB] focus:bg-white focus:ring-1 focus:ring-black focus:border-black resize-none min-h-[90px] text-[15px] text-black font-medium transition-all"
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
                                                        <FormGroup label="Ngày thu" name="ndong" value={formData.ndong} onChange={handleInputChange} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </TabsContent>

                        <TabsContent value="preview" className="m-0 flex justify-center">
                            <div className="w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-[#F2F2F2]">
                                <div className="p-10 text-center border-b border-[#F2F2F2] bg-[#FBFBFB]">
                                    <h2 className="text-[32px] font-serif text-[#10B981] tracking-tight leading-none mb-3">Eva's Fit</h2>
                                    <p className="text-[12px] font-medium text-black tracking-[4px] opacity-40 uppercase">Biên nhận thanh toán</p>
                                </div>
                                <div className="p-10 space-y-10">
                                    <div className="bg-[#10B981] rounded-[24px] p-8 text-white flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-medium tracking-tight uppercase">Xác nhận thanh toán</h3>
                                            <p className="text-[12px] opacity-80 font-medium tracking-wide mt-1 uppercase">Cơ sở: {formData.coso}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] opacity-70 font-medium tracking-widest mb-1 uppercase">Số tiền thanh toán</div>
                                            <div className="text-[28px] font-medium">{formData.tien1 || '0'} đ</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                        <PreviewField label="Tên Hội viên" value={formData.ten} color="#000000" />
                                        <PreviewField label="Số điện thoại" value={formData.sdt} color="#000000" />
                                        <PreviewField label="Email nhận" value={formData.email} color="#10B981" />
                                        <PreviewField label="Số CMND/CCCD" value={formData.cmnd} />
                                        <PreviewField label="Dịch vụ / Gói tập" value={formData.goi} />
                                        <PreviewField label="Huấn luyện viên" value={formData.hlv} />
                                        <PreviewField label="Ngày thanh toán" value={formData.ndong} />
                                    </div>
                                    <div className="bg-[#F2F9F7] rounded-[24px] p-8 border border-[#E1F2ED] space-y-5">
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
                </ScrollArea>

                    <div className="p-8 bg-white border-t border-[#F2F2F2] flex gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] mt-auto">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-2xl h-14 flex-1 font-medium text-slate-400 hover:bg-slate-50 transition-all"
                        >
                            Đóng
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={loading}
                            className="rounded-2xl h-14 flex-[2] font-medium bg-black hover:opacity-90 text-white shadow-2xl shadow-slate-200 transition-all active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 mr-3" />
                            )}
                            Gửi xác nhận thanh toán
                        </Button>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
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

function SelectGroup({ label, value, onChange, options, required = false, disabled = false, className }: any) {
    const [searchTerm, setSearchTerm] = React.useState('')

    // Lọc danh sách options dựa trên từ khóa tìm kiếm
    const filteredOptions = React.useMemo(() => {
        if (!searchTerm) return options
        const lowSearch = searchTerm.toLowerCase()
        return options.filter((opt: any) => 
            opt.label.toLowerCase().includes(lowSearch)
        )
    }, [options, searchTerm])

    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-[13px] font-medium text-black pl-1">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Select 
                value={value} 
                onValueChange={onChange} 
                disabled={disabled}
                onOpenChange={(open) => {
                    if (!open) setSearchTerm('') // Reset tìm kiếm khi đóng menu
                }}
            >
                <SelectTrigger className="w-full rounded-2xl border-[#EFEFEF] bg-[#FBFBFB] focus:bg-white focus:ring-1 focus:ring-black focus:border-black h-12 text-[15px] font-medium text-black transition-all">
                    <SelectValue placeholder={`Chọn...`} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-[#EFEFEF] shadow-2xl max-h-[300px]">
                    <div className="relative border-b border-[#F2F2F2] p-2" onKeyDown={(e) => e.stopPropagation()}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Tìm nhanh..."
                            className="pl-10 h-10 rounded-xl border-none bg-[#F9F9F9] focus:ring-0 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-sm text-slate-400">Không có dữ liệu phù hợp</div>
                    ) : (
                        filteredOptions.map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-[14px] font-medium rounded-xl m-1 py-3">
                                {opt.label}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        </div>
    )
}

function PreviewField({ label, value, color = '#000000' }: any) {
    return (
        <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-[#A0A0A0] uppercase tracking-wider">{label}</div>
            <div className="text-[15px] font-medium truncate" style={{ color }}>{value || '—'}</div>
        </div>
    )
}
