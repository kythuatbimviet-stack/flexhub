'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileUp, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { bulkCreateUsers } from '@/app/actions/users'
import { fetchBranches } from '@/app/actions/branches'

export function ImportUsersDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [previewData, setPreviewData] = React.useState<any[]>([])
    const [branches, setBranches] = React.useState<any[]>([])

    React.useEffect(() => {
        if (open) {
            fetchBranches().then(res => {
                if (res.success) setBranches(res.data)
            })
        }
    }, [open])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            const reader = new FileReader()
            reader.onload = (event) => {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const json = XLSX.utils.sheet_to_json(worksheet)
                setPreviewData(json.slice(0, 5)) // Preview first 5 rows
            }
            reader.readAsArrayBuffer(selectedFile)
        }
    }

    const downloadTemplate = () => {
        const template = [
            {
                name: 'Nguyễn Văn A',
                email: 'nva@ladyfit.vn',
                phone: '0987654321',
                branch_name: 'Lady Fit Thanh Xuân',
                position: 'Huấn luyện viên',
                department: 'Kinh doanh',
                role_id: 'User',
                status: 'Activated'
            }
        ]
        const worksheet = XLSX.utils.json_to_sheet(template)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
        XLSX.writeFile(workbook, 'LadyFit_Users_Template.xlsx')
    }

    const handleImport = async () => {
        if (!file) return
        setLoading(true)
        try {
            const reader = new FileReader()
            reader.onload = async (event) => {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const json = XLSX.utils.sheet_to_json(worksheet) as any[]

                const usersToCreate = json.map(user => {
                    const branch = branches.find(b =>
                        b.name?.toLowerCase() === user.branch_name?.toString().toLowerCase() ||
                        b.short_name?.toLowerCase() === user.branch_name?.toString().toLowerCase()
                    )
                    return {
                        name: user.name?.toString(),
                        email: user.email?.toString(),
                        phone: user.phone?.toString(),
                        branch_id: branch?.id || null,
                        branch_name: branch?.name || user.branch_name?.toString() || null,
                        position: user.position?.toString() || 'Nhân viên',
                        department: user.department?.toString() || 'Văn phòng',
                        role_id: user.role_id?.toString() || 'User',
                        status: user.status?.toString() || 'Activated'
                    }
                })

                const result = await bulkCreateUsers(usersToCreate)
                if (result.success) {
                    toast.success(`Đã import thành công ${usersToCreate.length} nhân sự`)
                    setOpen(false)
                    setFile(null)
                    setPreviewData([])
                    onSuccess()
                } else {
                    toast.error('Lỗi khi import: ' + result.error)
                }
            }
            reader.readAsArrayBuffer(file)
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi xử lý file')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl h-12 px-6 font-semibold border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                    <FileUp className="w-4 h-4 mr-2 text-slate-500" />
                    Nhập Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-950 p-0 overflow-hidden font-inter">
                <div className="p-8 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                <FileUp className="w-5 h-5" />
                            </div>
                            Nhập dữ liệu nhân sự
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            Tải lên tệp Excel chứa danh sách nhân viên để thêm vào hệ thống cùng lúc.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center relative group hover:border-red-300 dark:hover:border-red-900/50 transition-all">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm mx-auto flex items-center justify-center text-slate-400 group-hover:text-red-500 transition-colors">
                                <FileUp className="w-6 h-6" />
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                    {file ? file.name : 'Nhấp để chọn hoặc kéo thả file'}
                                </p>
                                <p className="text-slate-400 text-xs mt-1">Định dạng hỗ trợ: .xlsx, .xls</p>
                            </div>
                        </div>
                    </div>

                    {previewData.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Xem trước dữ liệu (5 dòng đầu)</h4>
                            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-3 py-2">Tên</th>
                                            <th className="px-3 py-2">Email</th>
                                            <th className="px-3 py-2">Chức vụ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 bg-white dark:bg-slate-950">
                                        {previewData.map((row, i) => (
                                            <tr key={i} className="text-slate-600 dark:text-slate-400">
                                                <td className="px-3 py-2 font-medium">{row.name}</td>
                                                <td className="px-3 py-2">{row.email}</td>
                                                <td className="px-3 py-2">{row.position}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                            <p className="font-bold mb-1">Cần lưu ý:</p>
                            Mục <b>Chi nhánh</b> phải có tên chính xác như đã tạo trong hệ thống để tự động liên kết dữ liệu.
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between gap-6">
                    <Button
                        variant="ghost"
                        onClick={downloadTemplate}
                        className="rounded-xl h-11 px-6 font-semibold text-xs text-slate-500 hover:text-red-500 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Tải file mẫu
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="rounded-xl h-11 px-6 font-semibold text-xs text-slate-400 hover:text-slate-950 dark:hover:text-white"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!file || loading}
                            className="rounded-xl h-11 px-8 bg-slate-950 dark:bg-red-600 text-white hover:bg-black dark:hover:bg-red-700 font-bold text-xs shadow-xl active:scale-95 transition-all"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xử lý...</>
                            ) : (
                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Bắt đầu Import</>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
