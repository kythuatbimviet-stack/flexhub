'use client'

import * as React from 'react'
import { FileUp, Loader2, Download, AlertCircle, CheckCircle2, ChevronLeft, ArrowRight } from 'lucide-react'
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
import { formatExcelDate, cn } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ImportExcelClientDialogProps {
    onSuccess: () => void
}

type ImportStep = 'upload' | 'preview'
type FilterType = 'all' | 'valid' | 'invalid'

export function ImportExcelClientDialog({ onSuccess }: ImportExcelClientDialogProps) {
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

    const validateData = (data: any[]) => {
        const errors: Record<number, string[]> = {}
        const formatted = data.map((row: any, index: number) => {
            const rowErrors: string[] = []
            
            // Required: Member Name
            const name = row['Tên hội viên'] || row['member_name']
            if (!name) rowErrors.push('Thiếu tên hội viên')

            // Date Parsing: Birthday
            const rawDob = row['Ngày sinh'] || row['date_of_birth'] || row['dob']
            const dob = formatExcelDate(rawDob)
            if (rawDob && !dob) {
                rowErrors.push(`Ngày sinh không hợp lệ: "${rawDob}"`)
            }

            if (rowErrors.length > 0) {
                errors[index] = rowErrors
            }

            return {
                _originalIndex: index,
                id: row['Mã KH'] || row['id'] || `EF-NEW-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                member_name: name || '',
                phone: row['Số điện thoại'] || row['phone'] || '',
                email: row['Email'] || row['email'] || '',
                address: row['Địa chỉ'] || row['address'] || '',
                date_of_birth: dob,
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
                dob: dob,
                signature_url: row['URL chữ ký'] || row['signature_url'] || '',
                created_by: row['Người tạo (ID)'] || row['created_by'] || '',
                created_by_email: row['Email người tạo'] || row['created_by_email'] || '',
            }
        })

        return { formatted, errors }
    }

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

                const { formatted, errors } = validateData(data)
                setParsedData(formatted)
                setValidationErrors(errors)
                setStep('preview')
            } catch (error: any) {
                console.error('Parse error:', error)
                toast.error('Lỗi khi đọc file Excel: ' + error.message)
            } finally {
                setIsUploading(false)
            }
        }

        reader.readAsBinaryString(file)
    }

    const handleConfirmImport = async () => {
        if (Object.keys(validationErrors).length > 0) {
            toast.error('Vui lòng sửa các lỗi dữ liệu trước khi nhập')
            return
        }

        setIsUploading(true)
        try {
            // CRITICAL: Remove UI-only fields like _originalIndex before sending to database
            const dataToInsert = parsedData.map(({ _originalIndex, ...rest }) => rest)
            
            const result = await importClients(dataToInsert)
            if (!result.success) throw new Error(result.error)

            toast.success(`Đã nhập thành công ${parsedData.length} khách hàng`)
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
                'URL chữ ký': '',
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'eva_fit_client_template.xlsx')
    }

    const errorCount = Object.keys(validationErrors).length
    const validCount = parsedData.length - errorCount

    const filteredData = React.useMemo(() => {
        if (filter === 'valid') return parsedData.filter((c) => !validationErrors[c._originalIndex])
        if (filter === 'invalid') return parsedData.filter((c) => validationErrors[c._originalIndex])
        return parsedData
    }, [filter, parsedData, validationErrors])

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all font-medium h-11 px-4">
                    <FileUp className="w-4 h-4 mr-2" />
                    Nhập Excel
                </Button>
            </DialogTrigger>
            <DialogContent className={cn(
                "rounded-3xl border-none shadow-2xl p-0 overflow-hidden transition-all duration-300",
                step === 'upload' ? "sm:max-w-md" : "sm:max-w-6xl h-[90vh]"
            )}>
                {step === 'upload' ? (
                    <div className="p-8">
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">Nhập liệu hàng loạt</DialogTitle>
                            <DialogDescription className="text-gray-500 text-sm">
                                Tải lên file Excel mẫu của Eva's Fit để cập nhật danh sách hội viên nhanh chóng.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-8">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl p-12 bg-gray-50/30 hover:bg-emerald-50/30 transition-all cursor-pointer group relative overflow-hidden">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <div className="relative z-0 flex flex-col items-center">
                                    {isUploading ? (
                                        <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
                                    ) : (
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <FileUp className="h-8 w-8 text-emerald-600" />
                                        </div>
                                    )}
                                    <p className="mt-4 text-sm font-bold text-gray-700">
                                        {isUploading ? 'Đang đọc file...' : 'Chọn file Excel'}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">Kéo thả file vào đây (.xlsx, .xls)</p>
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
                                        className="p-0 h-auto text-emerald-600 text-xs font-bold mt-2 hover:no-underline"
                                        onClick={downloadTemplate}
                                    >
                                        Tải xuống file mẫu (.xlsx)
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-8 pt-0">
                            <Button
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="rounded-xl font-semibold text-gray-400"
                            >
                                Đóng
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
                        <div className="p-6 border-b bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setStep('upload')}
                                        className="rounded-full hover:bg-white dark:hover:bg-gray-800"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <div>
                                        <DialogTitle className="text-lg font-bold">Kiểm tra dữ liệu</DialogTitle>
                                        <DialogDescription className="text-xs">
                                            Đã tìm thấy {parsedData.length} khách hàng trong file của bạn.
                                        </DialogDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {errorCount > 0 ? (
                                        <Badge variant="destructive" className="px-3 py-1 gap-1.5 rounded-full">
                                            <AlertCircle className="w-3 h-3" />
                                            {errorCount} lỗi cần sửa
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 px-3 py-1 gap-1.5 rounded-full">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Dữ liệu hợp lệ
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full">
                                <TabsList className="bg-white dark:bg-gray-800 p-1 h-10 rounded-xl border">
                                    <TabsTrigger value="all" className="rounded-lg text-xs font-bold px-6">
                                        Tất cả ({parsedData.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="valid" className="rounded-lg text-xs font-bold px-6 text-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                                        Hợp lệ ({validCount})
                                    </TabsTrigger>
                                    <TabsTrigger value="invalid" className="rounded-lg text-xs font-bold px-6 text-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                                        Có lỗi ({errorCount})
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            <ScrollArea className="h-full">
                                <div className="p-8">
                                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80 sticky top-0 z-10 backdrop-blur-sm">
                                                <TableRow>
                                                    <TableHead className="w-[60px] text-center font-bold">STT</TableHead>
                                                    <TableHead className="min-w-[150px] font-bold">Họ tên</TableHead>
                                                    <TableHead className="min-w-[120px] font-bold">Số điện thoại</TableHead>
                                                    <TableHead className="min-w-[120px] font-bold">Ngày sinh</TableHead>
                                                    <TableHead className="min-w-[150px] font-bold">Chi nhánh</TableHead>
                                                    <TableHead className="min-w-[200px] font-bold">Trạng thái / Chi tiết lỗi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredData.map((client) => {
                                                    const idx = client._originalIndex
                                                    const errors = validationErrors[idx]
                                                    return (
                                                        <TableRow key={idx} className={cn("transition-colors", errors ? "bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50" : "hover:bg-gray-50/50")}>
                                                            <TableCell className="text-center font-medium text-gray-400">{idx + 1}</TableCell>
                                                            <TableCell className="font-bold">{client.member_name || <span className="text-red-400 opacity-50 italic">Chưa nhập</span>}</TableCell>
                                                            <TableCell className="text-gray-600 dark:text-gray-400">{client.phone || '-'}</TableCell>
                                                            <TableCell className="text-gray-600 dark:text-gray-400">{client.date_of_birth || <span className="text-gray-300 italic">N/A</span>}</TableCell>
                                                            <TableCell className="text-gray-600 dark:text-gray-400">{client.branch_name || '-'}</TableCell>
                                                            <TableCell>
                                                                {errors ? (
                                                                    <div className="flex flex-col gap-1 py-1">
                                                                        {errors.map((err, i) => (
                                                                            <span key={i} className="text-[10px] text-red-500 font-bold flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                                                                                <AlertCircle className="w-3 h-3" />
                                                                                {err}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
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
                                                        <TableCell colSpan={6} className="h-32 text-center text-gray-400 font-medium">
                                                            Không có dữ liệu trong mục này
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="p-6 border-t flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex flex-col">
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {errorCount > 0 
                                        ? `Cần xử lý ${errorCount} lỗi trước khi có thể nhập dữ liệu.`
                                        : `Dữ liệu đã sẵn sàng để nhập (${validCount} khách hàng).`
                                    }
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    * Chỉ những dòng "Hợp lệ" mới được đưa vào hệ thống.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep('upload')} className="rounded-xl px-6 h-11 font-bold">
                                    Hủy bỏ
                                </Button>
                                <Button 
                                    onClick={handleConfirmImport} 
                                    disabled={isUploading || errorCount > 0 || parsedData.length === 0}
                                    className="rounded-xl px-8 h-11 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none min-w-[160px]"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            Xác nhận nhập
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
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
