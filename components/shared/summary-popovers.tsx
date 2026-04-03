'use client'

import React from 'react'
import { format } from 'date-fns'
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar'
import { PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    User, 
    Phone, 
    Calendar, 
    Clock, 
    Building2, 
    FileText,
    CreditCard,
    Target,
    Activity,
    Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Helper to calculate age
const calculateAge = (dob: string | null) => {
    if (!dob) return null
    try {
        const birthDate = new Date(dob)
        if (isNaN(birthDate.getTime())) return null
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    } catch (e) {
        return null
    }
}

// ── MEMBER SUMMARY POPOVER ────────────────────────────────────────────────
export const MemberSummaryPopover = ({ member, onShowDetails }: { member: any, onShowDetails: () => void }) => {
    const age = calculateAge(member.dob || member.date_of_birth)
    
    const weightLoss = React.useMemo(() => {
        const initial_w = parseFloat(member.initial_weight || member.weight || '0')
        const target_w = parseFloat(member.target_weight || '0')
        if (!isNaN(initial_w) && !isNaN(target_w) && initial_w > 0) {
            return initial_w - target_w
        }
        return null
    }, [member.initial_weight, member.weight, member.target_weight])

    const formattedDob = React.useMemo(() => {
        const dob = member.dob || member.date_of_birth
        if (!dob) return '--'
        try {
            const d = new Date(dob)
            if (isNaN(d.getTime())) return '--'
            return format(d, 'dd/MM/yyyy')
        } catch (e) {
            return '--'
        }
    }, [member.dob, member.date_of_birth])

    return (
        <PopoverContent 
            className="w-[320px] p-0 border-none shadow-2xl rounded-[24px] overflow-hidden bg-white dark:bg-gray-950 font-inter" 
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
                        <AvatarImage src={member.avatar_url} className="object-cover" />
                        <AvatarFallback className="bg-slate-50 text-slate-300">
                            <Plus className="w-8 h-8" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                        <h4 className="text-[17px] font-semibold text-slate-900 dark:text-white leading-tight">
                            {member.member_name}
                        </h4>
                        <span className="text-[14px] font-medium text-[#FD5771] tracking-tight">
                            {member.phone}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-600 font-medium font-inter">Ngày sinh</span>
                        <span className="text-slate-900 dark:text-slate-200 font-medium">
                            {formattedDob} 
                            {age !== null ? ` (${age} tuổi)` : ''}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-600 font-medium font-inter">Chiều cao</span>
                        <span className="text-slate-900 dark:text-slate-200 font-medium">{member.initial_height || member.height || '--'} cm</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-600 font-medium font-inter">Cân nặng ban đầu</span>
                        <span className="text-slate-900 dark:text-slate-200 font-medium">{member.initial_weight || member.weight || '--'} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-600 font-medium font-inter">Dự kiến giảm</span>
                        <span className="text-slate-900 dark:text-slate-200 font-medium">
                            {weightLoss !== null && weightLoss > 0 ? `${weightLoss} kg` : '--'}
                        </span>
                    </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

                <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-600 font-medium font-inter">Email</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer truncate max-w-[180px]">
                            {member.email || '--'}
                        </span>
                    </div>
                </div>

                <Button 
                    onClick={(e) => {
                        e.stopPropagation()
                        onShowDetails()
                    }}
                    className="w-full h-11 rounded-xl bg-[#FD5771] hover:bg-[#e04d64] text-white font-semibold text-[14px] transition-all active:scale-[0.98] shadow-sm"
                >
                    Xem chi tiết hội viên
                </Button>
            </div>
        </PopoverContent>
    )
}

// ── CONTRACT SUMMARY POPOVER ──────────────────────────────────────────────
export const ContractSummaryPopover = ({ contract, onShowDetails }: { contract: any, onShowDetails: () => void }) => {
    const remainingDays = React.useMemo(() => {
        if (!contract.end_date) return null
        const end = new Date(contract.end_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diff = end.getTime() - today.getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }, [contract.end_date])

    const formattedStartDate = contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '--'
    const formattedEndDate = contract.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : '--'

    return (
        <PopoverContent 
            className="w-[340px] p-0 border-none shadow-2xl rounded-[24px] overflow-hidden bg-white dark:bg-gray-950 font-inter" 
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-start border-b border-slate-50 dark:border-slate-800 pb-5">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                <FileText className="w-5 h-5 text-slate-900" />
                            </div>
                            <h4 className="text-[17px] font-semibold text-slate-900 dark:text-white">
                                {contract.id}
                            </h4>
                        </div>
                        <p className="text-[13px] font-medium text-slate-600 px-1 font-inter">
                            {contract.package_name || 'Chưa chọn gói'}
                        </p>
                    </div>
                    <Badge className={cn(
                        "rounded-lg text-[10px] font-medium uppercase tracking-wider py-1 px-2.5 border",
                        contract.status === 'Đang tập' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        contract.status === 'Hết hạn HĐ' ? "bg-rose-50 text-rose-600 border-rose-100" :
                        "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                        {contract.status || 'N/A'}
                    </Badge>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest block">Ngày bắt đầu</span>
                            <span className="text-[13px] font-medium text-slate-900 dark:text-slate-300 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {formattedStartDate}
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest block">Ngày kết thúc</span>
                            <span className="text-[13px] font-medium text-slate-900 dark:text-slate-300 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {formattedEndDate}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-4">
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-slate-600 font-medium font-inter">Tổng giá trị</span>
                            <span className="text-slate-900 dark:text-slate-100 font-medium">
                                {Number(contract.total_amount).toLocaleString('vi-VN')} ₫
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-slate-600 font-medium font-inter">Đã thanh toán</span>
                            <span className="text-emerald-600 font-medium">
                                {Number(contract.paid_amount || 0).toLocaleString('vi-VN')} ₫
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[13px] pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-slate-900 font-semibold font-inter text-[12px]">Còn nợ</span>
                            <span className="text-rose-600 font-semibold text-[14px]">
                                {Number(contract.remaining_amount || (contract.total_amount - (contract.paid_amount || 0))).toLocaleString('vi-VN')} ₫
                            </span>
                        </div>
                    </div>

                    {remainingDays !== null && (
                        <div className={cn(
                            "flex items-center gap-2 text-[12px] font-medium p-3 rounded-xl border",
                            remainingDays > 0 ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                            <Clock className="w-4 h-4 text-blue-400" />
                            {remainingDays > 0 ? `Hiệu lực còn ${remainingDays} ngày` : 'Hợp đồng quá hạn'}
                        </div>
                    )}
                </div>

                <Button 
                    onClick={(e) => {
                        e.stopPropagation()
                        onShowDetails()
                    }}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-[14px] transition-all active:scale-[0.98] shadow-sm"
                >
                    Xem chi tiết hợp đồng
                </Button>
            </div>
        </PopoverContent>
    )
}
