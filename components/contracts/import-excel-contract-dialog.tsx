'use client'

import * as React from 'react'
import {
    FileUp,
    Loader2,
    Download,
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ArrowRight,
    Calendar,
    RefreshCw,
    FileSpreadsheet,
    Info,
} from 'lucide-react'
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
import { importContracts } from '@/app/actions/contracts'
import { cn } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ImportExcelContractDialogProps {
    onSuccess: () => void
}

type ImportStep = 'upload' | 'preview'
type FilterType = 'all' | 'valid' | 'invalid'

// ──────────────────────────────────────────────────────────────────────────────
//  Date / DateTime parsers
//  Handles all real-world formats seen in Excel exports:
//    "22/03/2025 0:00"     → D/M/YYYY H:mm   (Vietnamese)
//    "07:28:35 29/3/2026"  → HH:mm:ss D/M/YYYY
//    "29/03/2026 7:28"     → D/M/YYYY H:mm
//    "3/22/2025 0:00"      → M/D/YYYY H:mm   (American Excel)
//    "2026-03-01"          → ISO date
//    JS Date object, Excel serial number
//  Disambiguation for "A/B/YYYY":
//    A > 12 → D/M/YYYY   B > 12 → M/D/YYYY   both ≤ 12 → D/M/YYYY (VN default)
// ──────────────────────────────────────────────────────────────────────────────

function parseExcelDateTime(value: any): string | null {
    if (value === null || value === undefined || value === '') return null

    // JS Date object
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value.toISOString()
    }

    // Excel serial number (e.g. 45678.5)
    if (typeof value === 'number') {
        // Excel epoch: 1 Jan 1900 = serial 1; JS epoch: 1 Jan 1970 = 0
        const d = new Date(Math.round((value - 25569) * 86400 * 1000))
        return isNaN(d.getTime()) ? null : d.toISOString()
    }

    const str = String(value).trim()
    if (!str) return null

    // Format 1: "HH:mm:ss D/M/YYYY"  e.g. "07:28:35 29/3/2026"
    const fmt1 = str.match(/^(\d{1,2}):(\d{2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (fmt1) {
        const [, HH, mm, ss, d, m, y] = fmt1
        const dt = new Date(+y, +m - 1, +d, +HH, +mm, +ss)
        return isNaN(dt.getTime()) ? null : dt.toISOString()
    }

    // Format 2: "A/B/YYYY H:mm" or "A/B/YYYY HH:mm:ss"
    const fmt2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (fmt2) {
        const [, a, b, y, HH, mm, ss] = fmt2
        const [day, month] = +a > 12 ? [+a, +b] : +b > 12 ? [+b, +a] : [+a, +b]
        const dt = new Date(+y, month - 1, day, +HH, +mm, +(ss || 0))
        return isNaN(dt.getTime()) ? null : dt.toISOString()
    }

    // Format 3: "A/B/YYYY" (date only)
    const fmt3 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (fmt3) {
        const [, a, b, y] = fmt3
        const [day, month] = +a > 12 ? [+a, +b] : +b > 12 ? [+b, +a] : [+a, +b]
        const dt = new Date(+y, month - 1, day)
        return isNaN(dt.getTime()) ? null : dt.toISOString()
    }

    // Format 4: "YYYY-MM-DD" ISO date
    const fmt4 = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (fmt4) {
        const [, y, m, d] = fmt4
        const dt = new Date(+y, +m - 1, +d)
        return isNaN(dt.getTime()) ? null : dt.toISOString()
    }

    // Fallback: native parse
    const parsed = new Date(str)
    return isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/** Returns "YYYY-MM-DD" (DB date type) or null */
function parseExcelDate(value: any): string | null {
    const iso = parseExcelDateTime(value)
    if (!iso) return null
    return iso.split('T')[0]
}

/** Format ISO → "DD/MM/YYYY" for display */
function fmtDateOnly(iso: string | null | undefined): React.ReactNode {
    if (!iso) return <span className="text-gray-300 text-[10px]">—</span>
    const d = new Date(iso)
    if (isNaN(d.getTime())) return <span className="text-red-500 text-[10px]">{iso}</span>
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Format ISO → "DD/MM/YYYY HH:mm" for display */
function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

/** Format number → Vietnamese currency */
function fmtMoney(v: number | null | undefined): string {
    if (v === null || v === undefined) return '—'
    return v.toLocaleString('vi-VN') + ' ₫'
}

// ──────────────────────────────────────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────────────────────────────────────

export function ImportExcelContractDialog({ onSuccess }: ImportExcelContractDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [step, setStep] = React.useState<ImportStep>('upload')
    const [filter, setFilter] = React.useState<FilterType>('all')
    const [isUploading, setIsUploading] = React.useState(false)
    const [parsedData, setParsedData] = React.useState<any[]>([])
    const [validationErrors, setValidationErrors] = React.useState<Record<number, string[]>>({})

    const resetState = () => {
        setStep('upload')
        setFilter('all')
        setParsedData([])
        setValidationErrors({})
        setIsUploading(false)
    }

    // ── Validation & field mapping ──────────────────────────────────────────
    function validateData(data: any[]) {
        const errors: Record<number, string[]> = {}

        const formatted = data.map((row: any, index: number) => {
            const rowErrors: string[] = []

            // ─── Required fields (NOT NULL in DB) ───
            const contractId = row['Mã hợp đồng'] || row['id']
            if (!contractId) rowErrors.push('Thiếu mã hợp đồng ("Mã hợp đồng")')

            const memberName = row['Hội viên'] || row['member_name']
            if (!memberName) rowErrors.push('Thiếu tên hội viên ("Hội viên")')

            // start_date is NOT NULL in DB → required
            const rawStartDate = row['Ngày bắt đầu'] || row['start_date']
            const startDate = parseExcelDate(rawStartDate)
            if (!rawStartDate) {
                rowErrors.push('Thiếu ngày bắt đầu ("Ngày bắt đầu")')
            } else if (!startDate) {
                rowErrors.push(`Ngày bắt đầu không hợp lệ: "${rawStartDate}"`)
            }

            // branch_id needed for RBAC check on server
            const branchId = row['Mã chi nhánh'] || row['branch_id']
            if (!branchId) rowErrors.push('Thiếu mã chi nhánh ("Mã chi nhánh")')

            // ─── Optional date fields — warn if present but unparseable ───
            const rawEndDate = row['Ngày kết thúc'] || row['end_date']
            const endDate = parseExcelDate(rawEndDate)
            if (rawEndDate && !endDate) rowErrors.push(`Ngày kết thúc không hợp lệ: "${rawEndDate}"`)

            const rawSigningDate = row['Ngày ký'] || row['signing_date']
            const signingDate = parseExcelDate(rawSigningDate)
            if (rawSigningDate && !signingDate) rowErrors.push(`Ngày ký không hợp lệ: "${rawSigningDate}"`)

            const rawDob = row['Ngày sinh'] || row['dob']
            const dob = parseExcelDate(rawDob)
            if (rawDob && !dob) rowErrors.push(`Ngày sinh không hợp lệ: "${rawDob}"`)

            // ─── Timestamp fields: read from Excel or fall back to now() ───
            const rawCreatedAt = row['Ngày tạo hệ thống'] || row['created_at']
            const createdAt = parseExcelDateTime(rawCreatedAt)
            const createdAtFromExcel = !!(rawCreatedAt && createdAt)

            const rawUpdatedAt = row['Cập nhật cuối'] || row['updated_at']
            const updatedAt = parseExcelDateTime(rawUpdatedAt)
            const updatedAtFromExcel = !!(rawUpdatedAt && updatedAt)

            // ─── Numeric helpers ───
            const numF = (v: any): number | null => {
                if (v === null || v === undefined || v === '') return null
                const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''))
                return isNaN(n) ? null : n
            }
            const numI = (v: any): number | null => {
                if (v === null || v === undefined || v === '') return null
                const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10)
                return isNaN(n) ? null : n
            }

            if (rowErrors.length > 0) errors[index] = rowErrors

            return {
                // ── UI metadata (stripped before DB insert) ──
                _originalIndex: index,
                _created_at_from_excel: createdAtFromExcel,
                _updated_at_from_excel: updatedAtFromExcel,

                // ── DB fields (aligned with contracts table schema) ──
                id: String(contractId || '').trim(),
                client_id: String(row['Mã khách hàng'] || row['client_id'] || '').trim(),
                status: row['Trạng thái'] || row['status'] || 'Chờ ký HĐ',
                branch_id: String(branchId || '').trim(),
                member_name: String(memberName || '').trim(),

                // Dates
                signing_date: signingDate,
                start_date: startDate,
                end_date: endDate,
                dob: dob,

                // Timestamps
                created_at: createdAt || new Date().toISOString(),
                updated_at: updatedAt || new Date().toISOString(),

                // Personal info
                phone: row['Số điện thoại'] || row['phone'] || '',
                email: row['Email'] || row['email'] || '',
                id_number: row['Số CMND/CCCD'] || row['id_number'] || '',
                member_address: row['Địa chỉ hội viên'] || row['member_address'] || '',

                // Facility
                facility_name: row['Chi nhánh'] || row['Tên cơ sở'] || row['facility_name'] || '',
                short_name: row['Tên viết tắt'] || row['short_name'] || '',
                address: row['Địa chỉ cơ sở'] || row['address'] || '',
                center_phone: row['Hotline trung tâm'] || row['center_phone'] || '',
                center_address: row['Địa chỉ trung tâm'] || row['center_address'] || '',

                // Contract info
                contract_type: row['Loại hợp đồng'] || row['contract_type'] || '',
                contract_name: row['Tên hợp đồng'] || row['contract_name'] || '',
                source: row['Nguồn khách'] || row['source'] || '',

                // Duration — integer in DB
                package_duration: numI(row['Thời hạn gói (tháng)'] || row['package_duration']),
                total_days: numI(row['Tổng số ngày'] || row['total_days']),

                // Legal
                legal_representative: row['Đại diện pháp luật'] || row['legal_representative'] || '',
                representative_phone: row['SĐT đại diện'] || row['representative_phone'] || '',

                // Body metrics — numeric(5,2) in DB
                initial_height: numF(row['Chiều cao ban đầu'] || row['initial_height']),
                initial_weight: numF(row['Cân nặng ban đầu'] || row['initial_weight']),
                target_weight: numF(row['Cân nặng mục tiêu'] || row['target_weight']),
                final_weight: numF(row['Cân nặng cuối cùng'] || row['final_weight']),
                weight_change: numF(row['Thay đổi cân nặng'] || row['weight_change']),

                // Health
                medical_conditions: row['Tình trạng sức khỏe'] || row['medical_conditions'] || '',
                medical_condition: row['Tình trạng bệnh lý'] || row['medical_condition'] || '',

                // Package
                membership_id: row['Mã gói tập'] || row['membership_id'] || '',
                package_name: row['Tên gói tập'] || row['package_name'] || '',
                package_type: row['Loại gói tập'] || row['package_type'] || '',
                quantity: numI(row['Số lượng'] || row['quantity']) ?? 1,   // integer, default 1
                custom_selection: row['Lựa chọn tùy chỉnh'] || row['custom_selection'] || '',

                // Pricing — numeric(12,2) in DB
                package_price: numF(row['Giá niêm yết'] || row['package_price']),
                package_price_text: row['Giá niêm yết (chữ)'] || row['package_price_text'] || '',
                price_before_discount: numF(row['Giá trước giảm'] || row['price_before_discount']),
                discounted_price: numF(row['Giá sau giảm'] || row['discounted_price']),
                discounted_price_text: row['Giá sau giảm (chữ)'] || row['discounted_price_text'] || '',
                total_amount: numF(row['Tổng tiền'] || row['total_amount']),
                total_amount_text: row['Tổng tiền (chữ)'] || row['total_amount_text'] || '',

                // Trainer
                trainer_type: row['Loại PT'] || row['trainer_type'] || '',
                total_sessions: numI(row['Tổng số buổi'] || row['total_sessions']),    // integer
                trainer_name: row['Tên PT'] || row['trainer_name'] || '',
                trainer_phone: row['SĐT PT'] || row['trainer_phone'] || '',
                assigned_pt: row['PT được chỉ định'] || row['assigned_pt'] || '',

                // Center staff
                center_representative: row['Đại diện trung tâm'] || row['center_representative'] || '',
                representative_name: row['Tên người đại diện'] || row['representative_name'] || '',
                staff_phone: row['SĐT nhân viên'] || row['staff_phone'] || '',

                // Payment
                payment_method: row['Phương thức thanh toán'] || row['payment_method'] || '',
                payment_installment: numI(row['Số kỳ thanh toán'] || row['payment_installment']) ?? 1, // integer
                account_number: numI(row['Số tài khoản'] || row['account_number']),               // bigint → parseInt
                account_holder: row['Chủ tài khoản'] || row['account_holder'] || '',
                bank_name: row['Tên ngân hàng'] || row['bank_name'] || '',
                payment_notes: row['Ghi chú thanh toán'] || row['payment_notes'] || '',

                // Files & media
                qr_payment_url: row['Link QR'] || row['qr_payment_url'] || '',
                contract_file_url: row['Link file HĐ'] || row['contract_file_url'] || '',
                contract_file_name: row['Tên file HĐ'] || row['contract_file_name'] || '',
                photo_1_url: row['Ảnh 1'] || row['photo_1_url'] || '',
                photo_2_url: row['Ảnh 2'] || row['photo_2_url'] || '',
                signature_url: row['Chữ ký hội viên'] || row['signature_url'] || '',
                signature_center: row['Chữ ký trung tâm'] || row['signature_center'] || '',

                // Misc
                month: row['Tháng'] || row['month'] || '',
                day: row['Ngày'] || row['day'] || '',
                action_log: row['Nhật ký hoạt động'] || row['action_log'] || '',

                // Audit
                created_by: row['Người tạo (ID)'] || row['created_by'] || '',
                created_by_email: row['Email người tạo'] || row['created_by_email'] || '',

                // Closure & Tracking
                closure_status: row['Trạng thái đóng/tất toán'] || row['closure_status'] || '',
                closure_reason: row['Lý do đóng'] || row['closure_reason'] || '',
                closed_at: parseExcelDate(row['Ngày đóng'] || row['closed_at']),
                is_receipt_sent: (row['Đã gửi biên lai'] || row['is_receipt_sent']) === 'Có' || (row['Đã gửi biên lai'] || row['is_receipt_sent']) === true,
                receipt_sent_at: parseExcelDateTime(row['Thời điểm gửi biên lai'] || row['receipt_sent_at']),
                sendemail_xntt: row['Gửi email XNTT'] || row['sendemail_xntt'] || '',
                email_message: row['Nội dung email'] || row['email_message'] || '',
            }
        })

        return { formatted, errors }
    }

    // ── File upload handler ─────────────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        // Reset input so the same file can be re-selected
        e.target.value = ''

        setIsUploading(true)
        const reader = new FileReader()

        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws, { defval: '' })

                if (data.length === 0) {
                    toast.error('File Excel không có dữ liệu')
                    setIsUploading(false)
                    return
                }

                const { formatted, errors } = validateData(data)
                setParsedData(formatted)
                setValidationErrors(errors)
                setIsUploading(false)
                setStep('preview')         // ← auto-switch to preview
            } catch (error: any) {
                console.error('Parse error:', error)
                toast.error('Lỗi khi đọc file Excel: ' + error.message)
                setIsUploading(false)
            }
        }

        reader.readAsBinaryString(file)
    }

    // ── Confirm import ──────────────────────────────────────────────────────
    const handleConfirmImport = async () => {
        if (Object.keys(validationErrors).length > 0) {
            toast.error('Vui lòng sửa các lỗi trước khi nhập')
            return
        }
        setIsUploading(true)
        try {
            // Strip all UI-only fields before sending to DB
            const dataToInsert = parsedData.map(({
                _originalIndex, _created_at_from_excel, _updated_at_from_excel,
                ...rest
            }) => rest)

            const result = await importContracts(dataToInsert)
            if (!result.success) throw new Error(result.error)

            toast.success(`Đã nhập thành công ${parsedData.length} hợp đồng`)
            setOpen(false)
            resetState()
            onSuccess()
        } catch (error: any) {
            console.error('Import error:', error)
            toast.error('Lỗi khi nhập dữ liệu: ' + error.message)
        } finally {
            setIsUploading(false)
        }
    }

    // ── Template download ───────────────────────────────────────────────────
    // Column names must exactly match what validateData() reads above.
    // Date format used: d/M/yyyy (Vietnamese) to make it clear.
    const downloadTemplate = () => {
        const template = [
            {
                // ── Required ──
                'Mã hợp đồng': 'HD-LGT-2603001',
                'Hội viên': 'Nguyễn Văn A',
                'Ngày bắt đầu': '01/03/2026',          // date NOT NULL
                'Mã chi nhánh': 'LGT',

                // ── Client info ──
                'Mã khách hàng': 'EF-HCM01-2603001',
                'Số điện thoại': '0901234567',
                'Email': 'vana@gmail.com',
                'Ngày sinh': '01/01/1990',              // dob — date
                'Số CMND/CCCD': '079090012345',
                'Địa chỉ hội viên': '123 Đường ABC, Quận 1, HCM',

                // ── Contract ──
                'Trạng thái': 'Đang tập',
                'Loại hợp đồng': 'Hội viên',
                'Tên hợp đồng': 'Hợp đồng dịch vụ hội viên',
                'Ngày ký': '01/03/2026',                // signing_date
                'Ngày kết thúc': '01/03/2027',          // end_date
                'Thời hạn gói (tháng)': 12,             // integer
                'Tổng số ngày': 365,                    // integer

                // ── Facility ──
                'Chi nhánh': "Eva's Fit Lê Gia Định",
                'Tên viết tắt': 'LGT',
                'Địa chỉ cơ sở': '123 Lê Gia Định, HCM',
                'Hotline trung tâm': '0281234567',
                'Địa chỉ trung tâm': '123 Lê Gia Định, Phường 1, HCM',

                // ── Source & legal ──
                'Nguồn khách': 'Facebook',
                'Đại diện pháp luật': 'Công ty TNHH Eva Fitness',
                'SĐT đại diện': '0281234567',

                // ── Health ──
                'Chiều cao ban đầu': 165,               // numeric(5,2)
                'Cân nặng ban đầu': 70,                 // numeric(5,2)
                'Cân nặng mục tiêu': 60,                // numeric(5,2)
                'Cân nặng cuối cùng': '',
                'Thay đổi cân nặng': '',
                'Tình trạng sức khỏe': 'Không có vấn đề đặc biệt',
                'Tình trạng bệnh lý': 'Không',

                // ── Package ──
                'Mã gói tập': 'VIP12',
                'Tên gói tập': 'VIP 12 Tháng',
                'Loại gói tập': 'Hội viên',
                'Số lượng': 1,                          // integer
                'Lựa chọn tùy chỉnh': '',

                // ── Pricing ──
                'Giá niêm yết': 15000000,               // numeric(12,2)
                'Giá niêm yết (chữ)': 'Mười lăm triệu đồng',
                'Giá trước giảm': 15000000,
                'Giá sau giảm': 13500000,
                'Giá sau giảm (chữ)': 'Mười ba triệu năm trăm nghìn đồng',
                'Tổng tiền': 13500000,
                'Tổng tiền (chữ)': 'Mười ba triệu năm trăm nghìn đồng',

                // ── Trainer ──
                'Loại PT': 'PT riêng',
                'Tổng số buổi': 48,                     // integer
                'Tên PT': 'Trần Văn B',
                'SĐT PT': '0912345678',
                'PT được chỉ định': 'pt.b@evafit.vn',

                // ── Staff ──
                'Đại diện trung tâm': 'Nguyễn Thi C',
                'Tên người đại diện': 'Nguyễn Thị C',
                'SĐT nhân viên': '0987654321',

                // ── Payment ──
                'Phương thức thanh toán': 'Chuyển khoản',
                'Số kỳ thanh toán': 1,                  // integer
                'Số tài khoản': 1234567890,             // bigint → integer
                'Chủ tài khoản': 'NGUYEN VAN A',
                'Tên ngân hàng': 'Vietcombank',
                'Ghi chú thanh toán': 'Đã thanh toán đủ',
                'Link QR': '',

                // ── Files ──
                'Link file HĐ': '',
                'Tên file HĐ': '',
                'Ảnh 1': '',
                'Ảnh 2': '',
                'Chữ ký hội viên': '',
                'Chữ ký trung tâm': '',

                // ── Misc ──
                'Tháng': '3',
                'Ngày': '1',

                // ── Audit — để trống nếu muốn dùng thời điểm hiện tại ──
                'Người tạo (ID)': '',
                'Email người tạo': 'nhanvien@evafit.vn',
                'Ngày tạo hệ thống': '22/03/2025 0:00',  // timestamp
                'Cập nhật cuối': '29/03/2026 7:28',       // timestamp
                'Nhật ký hoạt động': '',

                // Closure & Tracking
                'Trạng thái đóng/tất toán': '',
                'Lý do đóng': '',
                'Ngày đóng': '',
                'Đã gửi biên lai': 'Không',
                'Thời điểm gửi biên lai': '',
                'Gửi email XNTT': '',
                'Nội dung email': '',
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        // Auto-width
        const maxWidth = (col: string[]) => Math.max(12, ...col.map(c => (c || '').toString().length + 2))
        const cols = Object.keys(template[0])
        ws['!cols'] = cols.map(k => ({ wch: maxWidth([k, String((template[0] as any)[k] ?? '')]) }))

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Hợp đồng')
        XLSX.writeFile(wb, 'Template_Hop_Dong_EvaFit.xlsx')

        toast.success('Đã tải file mẫu')
    }

    // ── Derived counts ──────────────────────────────────────────────────────
    const errorCount = Object.keys(validationErrors).length
    const validCount = parsedData.length - errorCount

    const filteredData = React.useMemo(() => {
        if (filter === 'valid') return parsedData.filter(c => !validationErrors[c._originalIndex])
        if (filter === 'invalid') return parsedData.filter(c => validationErrors[c._originalIndex])
        return parsedData
    }, [filter, parsedData, validationErrors])

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all font-medium h-11 w-11 p-0"
                >
                    <FileUp className="w-5 h-5" />
                </Button>
            </DialogTrigger>

            <DialogContent className={cn(
                "rounded-3xl border-none shadow-2xl p-0 overflow-hidden transition-all duration-300",
                step === 'upload' ? "sm:max-w-lg" : "sm:max-w-[95vw] h-[92vh]"
            )}>

                {/* ══════════════════ STEP 1: UPLOAD ══════════════════ */}
                {step === 'upload' && (
                    <div className="p-8 font-inter">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-[18px] font-medium text-gray-900 dark:text-gray-100 leading-snug flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center shrink-0">
                                    <FileSpreadsheet className="w-5 h-5 text-red-500" />
                                </div>
                                Nhập hợp đồng từ Excel
                            </DialogTitle>
                            <DialogDescription className="text-[13px] text-gray-500 leading-relaxed">
                                Tải lên file Excel để nhập hàng loạt hợp đồng. Hệ thống sẽ hiển thị bảng xem trước và phát hiện lỗi trước khi lưu.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6 space-y-3">
                            {/* Drop zone */}
                            <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl p-12 bg-gray-50/30 dark:bg-gray-900/20 hover:bg-red-50/20 dark:hover:bg-red-950/10 transition-all cursor-pointer group overflow-hidden">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                {isUploading ? (
                                    <Loader2 className="h-10 w-10 text-red-500 animate-spin" />
                                ) : (
                                    <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                        <FileUp className="h-7 w-7 text-red-500" />
                                    </div>
                                )}
                                <p className="mt-4 text-[14px] font-medium text-gray-900 dark:text-gray-100">
                                    {isUploading ? 'Đang đọc file...' : 'Click hoặc kéo thả file vào đây'}
                                </p>
                                <p className="mt-1 text-[12px] text-gray-400">Hỗ trợ .xlsx, .xls</p>
                            </label>

                            {/* Info box — date format guide */}
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-[12px] text-gray-700 dark:text-gray-300 space-y-1 leading-relaxed">
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Định dạng ngày tháng được chấp nhận</p>
                                    <p>• Ngày thuần tuý: <code className="bg-blue-100/70 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[11px]">01/03/2026</code> hoặc <code className="bg-blue-100/70 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[11px]">2026-03-01</code></p>
                                    <p>• Ngày giờ: <code className="bg-blue-100/70 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[11px]">22/03/2025 0:00</code> hoặc <code className="bg-blue-100/70 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[11px]">07:28:35 29/3/2026</code></p>
                                    <p className="text-gray-400">Ô trống → hệ thống tự dùng thời điểm hiện tại</p>
                                </div>
                            </div>

                            {/* Template download */}
                            <div className="p-4 bg-gray-50/60 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                                <div className="w-9 h-9 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                    <Download className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">File mẫu đầy đủ</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Bao gồm tất cả cột theo cấu trúc hợp đồng</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-[12px] font-medium border-gray-200 shrink-0 h-8"
                                    onClick={downloadTemplate}
                                >
                                    Tải mẫu
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="pt-0">
                            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl text-[13px] font-medium text-gray-400">
                                Đóng
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* ══════════════════ STEP 2: PREVIEW ══════════════════ */}
                {step === 'preview' && (
                    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden font-inter">

                        {/* Header */}
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost" size="icon"
                                        onClick={() => setStep('upload')}
                                        className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                                    </Button>
                                    <div>
                                        <DialogTitle className="text-[16px] font-medium text-gray-900 dark:text-gray-100">Xem trước dữ liệu</DialogTitle>
                                        <p className="text-[12px] text-gray-500 mt-0.5">
                                            {parsedData.length} hợp đồng •{' '}
                                            <span className="text-emerald-600">{validCount} hợp lệ</span>
                                            {errorCount > 0 && <span className="text-red-500"> • {errorCount} có lỗi</span>}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {errorCount > 0 ? (
                                        <Badge variant="destructive" className="gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium">
                                            <AlertCircle className="w-3 h-3" />
                                            {errorCount} lỗi cần sửa
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Tất cả hợp lệ
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Filter tabs */}
                            <Tabs value={filter} onValueChange={v => setFilter(v as FilterType)}>
                                <TabsList className="bg-gray-100/60 dark:bg-gray-800 p-1 h-8 rounded-xl">
                                    <TabsTrigger value="all" className="rounded-lg text-[12px] font-medium px-4 h-6">
                                        Tất cả ({parsedData.length})
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="valid"
                                        className="rounded-lg text-[12px] font-medium px-4 h-6 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
                                    >
                                        Hợp lệ ({validCount})
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="invalid"
                                        className="rounded-lg text-[12px] font-medium px-4 h-6 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
                                    >
                                        Có lỗi ({errorCount})
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Table */}
                        <div className="flex-1 min-h-0 overflow-auto">
                            <div className="p-4">
                                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-[1300px] text-[12px]">
                                            <TableHeader className="bg-gray-50/80 dark:bg-gray-800/60 sticky top-0 z-10 backdrop-blur-sm">
                                                <TableRow className="border-b border-gray-100 dark:border-gray-700">
                                                    <TableHead className="w-10 text-center text-gray-400 font-medium text-[11px] py-3">#</TableHead>
                                                    <TableHead className="min-w-[145px] text-gray-900 dark:text-gray-100 font-medium text-[11px]">Mã hợp đồng</TableHead>
                                                    <TableHead className="min-w-[140px] text-gray-900 dark:text-gray-100 font-medium text-[11px]">Hội viên</TableHead>
                                                    <TableHead className="min-w-[90px] text-gray-900 dark:text-gray-100 font-medium text-[11px]">Chi nhánh</TableHead>
                                                    {/* Date columns — subtle orange tint */}
                                                    <TableHead className="min-w-[105px] font-medium text-[11px] bg-orange-50/40 dark:bg-orange-900/10 text-gray-700 dark:text-gray-300">
                                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-orange-400" />Ngày sinh</div>
                                                    </TableHead>
                                                    <TableHead className="min-w-[105px] font-medium text-[11px] bg-orange-50/40 dark:bg-orange-900/10 text-gray-700 dark:text-gray-300">
                                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-orange-400" />Bắt đầu</div>
                                                    </TableHead>
                                                    <TableHead className="min-w-[105px] font-medium text-[11px] bg-orange-50/40 dark:bg-orange-900/10 text-gray-700 dark:text-gray-300">
                                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-orange-400" />Kết thúc</div>
                                                    </TableHead>
                                                    <TableHead className="min-w-[120px] font-medium text-[11px] text-gray-900 dark:text-gray-100 text-right">Tổng tiền</TableHead>
                                                    {/* Timestamp columns */}
                                                    <TableHead className="min-w-[155px] font-medium text-[11px] bg-blue-50/30 dark:bg-blue-900/10 text-gray-700 dark:text-gray-300">
                                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-400" />Ngày tạo</div>
                                                    </TableHead>
                                                    <TableHead className="min-w-[155px] font-medium text-[11px] bg-purple-50/30 dark:bg-purple-900/10 text-gray-700 dark:text-gray-300">
                                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-purple-400" />Cập nhật</div>
                                                    </TableHead>
                                                    <TableHead className="min-w-[220px] text-gray-900 dark:text-gray-100 font-medium text-[11px]">Kiểm tra</TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {filteredData.map((contract) => {
                                                    const idx = contract._originalIndex
                                                    const rowErrors = validationErrors[idx]
                                                    const hasError = !!rowErrors

                                                    return (
                                                        <TableRow
                                                            key={idx}
                                                            className={cn(
                                                                "transition-colors border-b border-gray-50 dark:border-gray-800/50",
                                                                hasError
                                                                    ? "bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50/70"
                                                                    : "hover:bg-gray-50/60 dark:hover:bg-gray-800/20"
                                                            )}
                                                        >
                                                            {/* STT */}
                                                            <TableCell className="text-center text-gray-400 text-[11px] py-2.5">{idx + 1}</TableCell>

                                                            {/* Mã HĐ */}
                                                            <TableCell className="py-2.5">
                                                                <span className={cn(
                                                                    "font-mono text-[11px]",
                                                                    contract.id ? "text-gray-900 dark:text-gray-100" : "text-red-400"
                                                                )}>
                                                                    {contract.id || '—'}
                                                                </span>
                                                            </TableCell>

                                                            {/* Hội viên */}
                                                            <TableCell className="py-2.5">
                                                                <span className={cn(
                                                                    "text-[12px]",
                                                                    contract.member_name
                                                                        ? "text-gray-900 dark:text-gray-100 font-medium"
                                                                        : "text-red-400"
                                                                )}>
                                                                    {contract.member_name || '—'}
                                                                </span>
                                                            </TableCell>

                                                            {/* Chi nhánh */}
                                                            <TableCell className="py-2.5">
                                                                <span className={cn(
                                                                    "font-mono text-[11px]",
                                                                    contract.branch_id ? "text-gray-900 dark:text-gray-100" : "text-red-400"
                                                                )}>
                                                                    {contract.branch_id || '—'}
                                                                </span>
                                                            </TableCell>

                                                            {/* Ngày sinh */}
                                                            <TableCell className="bg-orange-50/20 dark:bg-orange-900/5 py-2.5 whitespace-nowrap text-gray-900 dark:text-gray-200 text-[11px]">
                                                                {fmtDateOnly(contract.dob)}
                                                            </TableCell>

                                                            {/* Ngày bắt đầu — required */}
                                                            <TableCell className="bg-orange-50/20 dark:bg-orange-900/5 py-2.5 whitespace-nowrap text-[11px]">
                                                                {contract.start_date
                                                                    ? <span className="text-gray-900 dark:text-gray-100">{fmtDateOnly(contract.start_date)}</span>
                                                                    : <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Trống</span>
                                                                }
                                                            </TableCell>

                                                            {/* Ngày kết thúc */}
                                                            <TableCell className="bg-orange-50/20 dark:bg-orange-900/5 py-2.5 whitespace-nowrap text-gray-900 dark:text-gray-200 text-[11px]">
                                                                {fmtDateOnly(contract.end_date)}
                                                            </TableCell>

                                                            {/* Tổng tiền */}
                                                            <TableCell className="py-2.5 text-right text-gray-900 dark:text-gray-100 tabular-nums text-[11px] font-medium">
                                                                {fmtMoney(contract.total_amount)}
                                                            </TableCell>

                                                            {/* Ngày tạo */}
                                                            <TableCell className="bg-blue-50/20 dark:bg-blue-900/5 py-2.5 whitespace-nowrap">
                                                                <div className="flex items-center gap-1.5">
                                                                    {contract._created_at_from_excel
                                                                        ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" title="Lấy từ file Excel" />
                                                                        : <RefreshCw className="w-3 h-3 text-amber-400 shrink-0" title="Ô trống → dùng thời điểm hiện tại" />
                                                                    }
                                                                    <span className={cn(
                                                                        "font-mono text-[10px]",
                                                                        contract._created_at_from_excel
                                                                            ? "text-gray-900 dark:text-gray-100"
                                                                            : "text-amber-500"
                                                                    )}>
                                                                        {fmtDateTime(contract.created_at)}
                                                                    </span>
                                                                </div>
                                                            </TableCell>

                                                            {/* Cập nhật */}
                                                            <TableCell className="bg-purple-50/20 dark:bg-purple-900/5 py-2.5 whitespace-nowrap">
                                                                <div className="flex items-center gap-1.5">
                                                                    {contract._updated_at_from_excel
                                                                        ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" title="Lấy từ file Excel" />
                                                                        : <RefreshCw className="w-3 h-3 text-amber-400 shrink-0" title="Ô trống → dùng thời điểm hiện tại" />
                                                                    }
                                                                    <span className={cn(
                                                                        "font-mono text-[10px]",
                                                                        contract._updated_at_from_excel
                                                                            ? "text-gray-900 dark:text-gray-100"
                                                                            : "text-amber-500"
                                                                    )}>
                                                                        {fmtDateTime(contract.updated_at)}
                                                                    </span>
                                                                </div>
                                                            </TableCell>

                                                            {/* Kết quả kiểm tra */}
                                                            <TableCell className="py-2.5">
                                                                {hasError ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        {rowErrors.map((err, i) => (
                                                                            <span key={i} className="flex items-start gap-1 bg-red-50 dark:bg-red-900/20 text-red-500 text-[10px] px-2 py-0.5 rounded-md font-medium leading-snug">
                                                                                <AlertCircle className="w-3 h-3 shrink-0 mt-px" />
                                                                                {err}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[11px] px-2 py-0.5 rounded-md font-medium">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        Hợp lệ
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}

                                                {filteredData.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={11} className="h-32 text-center text-[12px] text-gray-400">
                                                            Không có dữ liệu trong mục này
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 px-1">
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        Ngày lấy từ file Excel
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                        <RefreshCw className="w-3 h-3 text-amber-400" />
                                        Ô trống — dùng thời điểm hiện tại
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                        <Calendar className="w-3 h-3 text-orange-400" />
                                        Cột ngày cần kiểm tra kỹ
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900/50 shrink-0">
                            <div>
                                <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
                                    {errorCount > 0
                                        ? `Cần sửa ${errorCount} dòng lỗi trước khi nhập`
                                        : `Sẵn sàng nhập ${validCount} hợp đồng vào hệ thống`
                                    }
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">Chỉ dòng hợp lệ mới được lưu vào cơ sở dữ liệu.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep('upload')} className="rounded-xl px-5 h-9 text-[13px] font-medium">
                                    Chọn lại file
                                </Button>
                                <Button
                                    onClick={handleConfirmImport}
                                    disabled={isUploading || errorCount > 0 || parsedData.length === 0}
                                    className="rounded-xl px-6 h-9 text-[13px] font-medium bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200/60 dark:shadow-none min-w-[150px]"
                                >
                                    {isUploading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xử lý...</>
                                    ) : (
                                        <>Xác nhận nhập<ArrowRight className="w-4 h-4 ml-2" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
