'use client'

import * as React from 'react'
import { numberToVietnameseWords } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface ContractPrintTemplateProps {
    contract: any
}

export const ContractPrintTemplate = React.forwardRef<HTMLDivElement, ContractPrintTemplateProps>(
    ({ contract }, ref) => {
        if (!contract) return null

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
        }

        const formatDate = (dateStr: string) => {
            if (!dateStr) return '.../.../...'
            return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi })
        }

        const centerName = contract.facility_name || contract.branches?.name || 'TRUNG TÂM LADY FIT'
        const centerShortName = contract.short_name || 'LADY FIT'

        return (
            <div
                ref={ref}
                className="bg-white p-16 font-serif leading-relaxed text-[13px] w-[210mm] min-h-[297mm] mx-auto shadow-lg print:shadow-none print:m-0"
                style={{ color: '#000000', backgroundColor: '#ffffff' }}
            >
                {/* Header */}
                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-2xl font-bold uppercase tracking-widest" style={{ color: '#b91c1c' }}>Hợp đồng dịch vụ huấn luyện</h1>
                    <p className="text-sm italic" style={{ color: '#4b5563' }}>Số: {contract.id || '........'}/HĐ-LF</p>
                </div>

                <div className="mb-6">
                    <p className="indent-8 text-justify">
                        Hôm nay, tại phòng tập <span className="font-bold">{centerShortName}</span> chúng tôi gồm:
                    </p>
                </div>

                {/* Section 1: Trung tam */}
                <div className="mb-8">
                    <h3 className="font-bold uppercase mb-3 border-b pb-1" style={{ borderBottomColor: '#000000' }}>Bên A: TRUNG TÂM {centerShortName.toUpperCase()}</h3>
                    <div className="grid grid-cols-1 gap-1.5 ml-4">
                        <p><span className="font-semibold underline">Đại diện:</span> {contract.center_representative || '.........................................................'}</p>
                        <p><span className="font-semibold underline">Địa chỉ:</span> {contract.address || '.........................................................'}</p>
                        <p><span className="font-semibold underline">Số điện thoại:</span> {contract.center_phone || '................................'}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <p><span className="font-semibold underline">Số tài khoản:</span> {contract.account_number || '................................'}</p>
                            <p><span className="font-semibold underline">Ngân hàng:</span> {contract.bank_name || '................................'}</p>
                        </div>
                        <p><span className="font-semibold underline">Chủ tài khoản:</span> {contract.account_holder || '................................'}</p>
                    </div>
                </div>

                {/* Section 2: Hoi vien */}
                <div className="mb-8">
                    <h3 className="font-bold uppercase mb-3 border-b pb-1" style={{ borderBottomColor: '#000000' }}>Bên B: HỘI VIÊN (KHÁCH HÀNG)</h3>
                    <div className="grid grid-cols-1 gap-1.5 ml-4">
                        <p><span className="font-semibold underline">Họ và tên:</span> <span className="font-bold uppercase">{contract.member_name}</span></p>
                        <div className="grid grid-cols-2 gap-4">
                            <p><span className="font-semibold underline">Ngày sinh:</span> {formatDate(contract.dob)}</p>
                            <p><span className="font-semibold underline">Số CMND/CCCD:</span> {contract.id_number || '................................'}</p>
                        </div>
                        <p><span className="font-semibold underline">Địa chỉ thường trú:</span> {contract.member_address || '.........................................................'}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <p><span className="font-semibold underline">Số điện thoại:</span> {contract.phone}</p>
                            <p><span className="font-semibold underline">Email:</span> {contract.email || '................................'}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <p><span className="font-semibold underline">Chiều cao:</span> {contract.initial_height || '....'} cm</p>
                            <p><span className="font-semibold underline">Cân nặng:</span> {contract.initial_weight || '....'} kg</p>
                            <p><span className="font-semibold underline">Bệnh lý:</span> {contract.medical_condition || 'Không'}</p>
                        </div>
                        {(contract.representative_name || contract.representative_phone) && (
                            <div className="mt-2 p-2 border border-dashed rounded" style={{ borderColor: '#d1d5db' }}>
                                <p className="text-[11px] italic mb-1" style={{ color: '#4b5563' }}>Thông tin người đại diện theo pháp luật (nếu Hội viên dưới 18 tuổi):</p>
                                <p><span className="font-semibold underline">Họ và tên:</span> {contract.representative_name || '................................'}</p>
                                <p><span className="font-semibold underline">Số ĐT:</span> {contract.representative_phone || '................................'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 3: Goi tap */}
                <div className="mb-8">
                    <h3 className="font-bold uppercase mb-3 border-b pb-1" style={{ borderBottomColor: '#000000' }}>Nội dung gói dịch vụ</h3>
                    <div className="grid grid-cols-1 gap-3 p-4 border rounded-xl" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Gói tập đăng ký</p>
                                <p className="text-[15px] font-bold uppercase" style={{ color: '#b91c1c' }}>{contract.package_name}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Số buổi / Cân khoán</p>
                                <p className="text-[15px] font-bold">{contract.total_sessions || '--'} buổi</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Ngày bắt đầu</p>
                                <p className="text-[14px] font-semibold">{formatDate(contract.start_date)}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Ngày kết thúc (Dự kiến)</p>
                                <p className="text-[14px] font-semibold">{formatDate(contract.end_date)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Huấn luyện viên phụ trách</p>
                                <p className="text-[14px] font-semibold">{contract.trainer_name || 'Đang cập nhật'}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Hình thức HL</p>
                                <p className="text-[14px] font-semibold">{contract.trainer_type || 'Trực tiếp'}</p>
                            </div>
                        </div>

                        <div className="mt-2 pt-2 border-t" style={{ borderTopColor: '#e5e7eb' }}>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Tổng giá trị hợp đồng</p>
                                    <p className="text-xl font-black" style={{ color: '#b91c1c' }}>{formatCurrency(contract.total_amount)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] italic" style={{ color: '#6b7280' }}>
                                        (Bằng chữ: {numberToVietnameseWords(contract.total_amount)} đồng chẵn)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 4: Dieu khoan quan trong */}
                <div className="mb-8 text-justify">
                    <h3 className="font-bold uppercase mb-2">Các điều khoản chính</h3>
                    <div className="space-y-2 text-[11px] leading-relaxed">
                        <p>1. <span className="font-bold italic">Thanh toán:</span> Hội viên có trách nhiệm thanh toán đầy đủ giá trị hợp đồng trước khi kích hoạt gói tập. Trường hợp trả góp hoặc cọc, cần tuân thủ đúng lộ trình đã cam kết.</p>
                        <p>2. <span className="font-bold italic">Thời hạn:</span> Gói tập có hiệu lực kể từ ngày ký. Sau thời hạn quy định, nếu Hội viên chưa sử dụng hết số buổi, gói tập sẽ tự động hết hạn trừ khi có thỏa thuận bảo lưu bằng văn bản.</p>
                        <p>3. <span className="font-bold italic">Nội quy:</span> Hội viên cam kết tuân thủ mọi nội quy của phòng tập, mặc trang phục phù hợp và giữ gìn vệ sinh, tài sản chung.</p>
                        <p>4. <span className="font-bold italic">Miễn trừ trách nhiệm:</span> Trung tâm không chịu trách nhiệm về các chấn thương xảy ra do Hội viên không tuân thủ hướng dẫn của HLV hoặc tự ý tập luyện sai cách.</p>
                    </div>
                </div>

                {/* Footer Signatures */}
                <div className="mt-16 grid grid-cols-2 text-center">
                    <div className="space-y-20">
                        <div>
                            <p className="font-bold uppercase">Đại diện trung tâm</p>
                            <p className="text-[10px] italic">(Ký và ghi rõ họ tên)</p>
                        </div>
                        <p className="font-bold">{contract.center_representative || '................................'}</p>
                    </div>
                    <div className="space-y-20">
                        <div>
                            <p className="font-bold uppercase">Hội viên (Khách hàng)</p>
                            <p className="text-[10px] italic">(Ký và ghi rõ họ tên)</p>
                        </div>
                        <p className="font-bold">{contract.member_name}</p>
                    </div>
                </div>

                <div className="mt-20 text-center text-[10px] border-t pt-2" style={{ color: '#9ca3af', borderTopColor: '#e5e7eb' }}>
                    <p>© {new Date().getFullYear()} {centerName} - Hệ thống quản lý chuyên nghiệp</p>
                </div>
            </div>
        )
    }
)

ContractPrintTemplate.displayName = 'ContractPrintTemplate'
