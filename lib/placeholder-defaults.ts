// Shared constant - can be imported by both client and server components
// DO NOT add 'use server' or 'use client' here

export type PlaceholderCategory = 'member' | 'center' | 'package' | 'contract' | 'general'

export const DEFAULT_PLACEHOLDERS: {
    key: string
    label: string
    description: string
    category: PlaceholderCategory
    sample_value: string
    is_active: boolean
    is_default: boolean
    sort_order: number
}[] = [
    // Hội viên
    { key: '{{member_name}}',       label: 'Họ và tên',           description: 'Họ và tên đầy đủ của hội viên (in hoa)',           category: 'member',   sample_value: 'NGUYỄN THỊ MAI',            is_active: true, is_default: true, sort_order: 10  },
    { key: '{{phone}}',             label: 'Số điện thoại',        description: 'SĐT hội viên',                                     category: 'member',   sample_value: '0912 345 678',              is_active: true, is_default: true, sort_order: 20  },
    { key: '{{email}}',             label: 'Email',                description: 'Email hội viên',                                    category: 'member',   sample_value: 'mai.nguyen@email.com',       is_active: true, is_default: true, sort_order: 30  },
    { key: '{{dob}}',               label: 'Ngày sinh',            description: 'Ngày sinh hội viên (dd/mm/yyyy)',                   category: 'member',   sample_value: '15/03/1995',                is_active: true, is_default: true, sort_order: 40  },
    { key: '{{address}}',           label: 'Địa chỉ',             description: 'Địa chỉ thường trú hội viên',                      category: 'member',   sample_value: '123 Đường Lê Lợi, Quận 1', is_active: true, is_default: true, sort_order: 50  },
    { key: '{{id_number}}',         label: 'CMND/CCCD',            description: 'Số chứng minh nhân dân / căn cước',                category: 'member',   sample_value: '079195012345',              is_active: true, is_default: true, sort_order: 60  },
    { key: '{{initial_height}}',    label: 'Chiều cao',            description: 'Chiều cao ban đầu (cm)',                            category: 'member',   sample_value: '162',                       is_active: true, is_default: true, sort_order: 70  },
    { key: '{{initial_weight}}',    label: 'Cân nặng',            description: 'Cân nặng ban đầu (kg)',                             category: 'member',   sample_value: '55',                        is_active: true, is_default: true, sort_order: 80  },
    { key: '{{medical_condition}}', label: 'Bệnh lý',             description: 'Tình trạng bệnh lý (mặc định: Không)',              category: 'member',   sample_value: 'Không',                     is_active: true, is_default: true, sort_order: 90  },
    // Trung tâm
    { key: '{{center_name}}',           label: 'Tên trung tâm',        description: 'Tên đầy đủ của trung tâm',                    category: 'center',   sample_value: 'TRUNG TÂM LADY FIT',        is_active: true, is_default: true, sort_order: 110 },
    { key: '{{center_short_name}}',     label: 'Tên viết tắt TT',      description: 'Tên viết tắt trung tâm',                      category: 'center',   sample_value: 'LADY FIT',                  is_active: true, is_default: true, sort_order: 120 },
    { key: '{{center_representative}}', label: 'Đại diện trung tâm',   description: 'Người đại diện ký hợp đồng',                  category: 'center',   sample_value: 'Nguyễn Minh Trí',           is_active: true, is_default: true, sort_order: 130 },
    { key: '{{center_phone}}',          label: 'SĐT trung tâm',        description: 'Số điện thoại trung tâm (từ bảng branches)',  category: 'center',   sample_value: '028 1234 5678',             is_active: true, is_default: true, sort_order: 140 },
    { key: '{{center_address}}',        label: 'Địa chỉ trung tâm',    description: 'Địa chỉ trung tâm (từ bảng branches)',        category: 'center',   sample_value: '456 Nguyễn Trãi, Quận 5',  is_active: true, is_default: true, sort_order: 150 },
    { key: '{{legal_representative}}',  label: 'Người đại diện PL',    description: 'Người đại diện pháp luật của chi nhánh',      category: 'center',   sample_value: 'NGUYỄN VĂN AN',            is_active: true, is_default: true, sort_order: 160 },
    { key: '{{representative_phone}}',  label: 'SĐT đại diện PL',      description: 'SĐT người đại diện pháp luật',                category: 'center',   sample_value: '0901 234 567',              is_active: true, is_default: true, sort_order: 170 },
    { key: '{{branch_name}}',           label: 'Tên chi nhánh',        description: 'Tên chi nhánh trực tiếp',                     category: 'center',   sample_value: 'Chi nhánh Quận 1',          is_active: true, is_default: true, sort_order: 180 },
    { key: '{{account_number}}',        label: 'Số tài khoản',         description: 'Số tài khoản ngân hàng trung tâm',            category: 'center',   sample_value: '1234567890',                is_active: true, is_default: true, sort_order: 190 },
    { key: '{{bank_name}}',             label: 'Ngân hàng',            description: 'Tên ngân hàng',                                category: 'center',   sample_value: 'Vietcombank',               is_active: true, is_default: true, sort_order: 200 },
    { key: '{{account_holder}}',        label: 'Chủ tài khoản',        description: 'Tên chủ tài khoản',                            category: 'center',   sample_value: 'NGUYỄN VĂN AN',            is_active: true, is_default: true, sort_order: 210 },
    // Gói dịch vụ
    { key: '{{package_name}}',      label: 'Tên gói tập',          description: 'Tên gói dịch vụ đăng ký',                          category: 'package',  sample_value: 'GÓI PT CAO CẤP 3 THÁNG',   is_active: true, is_default: true, sort_order: 310 },
    { key: '{{total_sessions}}',    label: 'Số buổi',              description: 'Tổng số buổi tập',                                  category: 'package',  sample_value: '36',                        is_active: true, is_default: true, sort_order: 320 },
    { key: '{{start_date}}',        label: 'Ngày bắt đầu',         description: 'Ngày bắt đầu hợp đồng (dd/mm/yyyy)',               category: 'package',  sample_value: '01/04/2026',                is_active: true, is_default: true, sort_order: 330 },
    { key: '{{end_date}}',          label: 'Ngày kết thúc',        description: 'Ngày kết thúc hợp đồng (dd/mm/yyyy)',              category: 'package',  sample_value: '30/06/2026',                is_active: true, is_default: true, sort_order: 340 },
    { key: '{{trainer_name}}',      label: 'Tên HLV',              description: 'Huấn luyện viên phụ trách',                        category: 'package',  sample_value: 'Trần Văn Hùng',             is_active: true, is_default: true, sort_order: 350 },
    { key: '{{trainer_type}}',      label: 'Hình thức HL',         description: 'Hình thức huấn luyện (trực tiếp / online)',        category: 'package',  sample_value: 'Trực tiếp',                is_active: true, is_default: true, sort_order: 360 },
    // Hợp đồng
    { key: '{{contract_id}}',        label: 'Mã hợp đồng',         description: 'ID hợp đồng',                                     category: 'contract', sample_value: 'HĐ-2026-0001',             is_active: true, is_default: true, sort_order: 410 },
    { key: '{{signing_date}}',       label: 'Ngày ký',             description: 'Ngày ký hợp đồng (dd/mm/yyyy)',                    category: 'contract', sample_value: '01/04/2026',                is_active: true, is_default: true, sort_order: 420 },
    { key: '{{total_amount}}',       label: 'Tổng tiền',           description: 'Giá trị hợp đồng (định dạng tiền VND)',            category: 'contract', sample_value: '12.000.000 ₫',             is_active: true, is_default: true, sort_order: 430 },
    { key: '{{total_amount_words}}', label: 'Tổng tiền (chữ)',     description: 'Giá trị hợp đồng bằng chữ tiếng Việt',            category: 'contract', sample_value: 'Mười hai triệu',            is_active: true, is_default: true, sort_order: 440 },
    { key: '{{payment_method}}',     label: 'Hình thức thanh toán',description: 'Phương thức thanh toán',                           category: 'contract', sample_value: 'Tiền mặt',                  is_active: true, is_default: true, sort_order: 450 },
]
