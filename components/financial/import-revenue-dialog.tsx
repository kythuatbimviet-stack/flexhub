'use client'

import * as React from 'react'
import { FileUp, Loader2, Download } from 'lucide-react'
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
import { bulkCreateRevenue, fetchFinancialCategories } from '@/app/actions/financial'
import { fetchBranches } from '@/app/actions/branches'
import { useQuery } from '@tanstack/react-query'

interface ImportExcelRevenueDialogProps {
    onSuccess: () => void
}

export function ImportExcelRevenueDialog({ onSuccess }: ImportExcelRevenueDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: categories } = useQuery({
        queryKey: ['financial-categories-revenue'],
        queryFn: async () => {
            const result = await fetchFinancialCategories('revenue')
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

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

                const revenueToInsert = data.map((row: any) => {
                    // Try to map category and branch names to IDs
                    const category = categories?.find((c: any) => c.name === row['Danh mục'])
                    const branch = branches?.find((b: any) => b.name === row['Chi nhánh'])

                    return {
                        amount: row['Số tiền'] || 0,
                        category_id: category?.id || null,
                        branch_id: branch?.id || null,
                        description: row['Diễn giải'] || row['Ghi chú'] || '',
                        payment_method: row['Thanh toán'] || 'Tiền mặt',
                        recorded_at: row['Ngày'] ? new Date(row['Ngày']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    }
                })

                const result = await bulkCreateRevenue(revenueToInsert)

                if (!result.success) throw new Error(result.error)

                toast.success(`Đã nhập thành công ${revenueToInsert.length} khoản thu`)
                setOpen(false)
                onSuccess()
            } catch (error: any) {
                console.error('Import error:', error)
                toast.error('Lỗi khi nhập dữ liệu từ Excel: ' + error.message)
            } finally {
                setIsUploading(false)
            }
        }

        reader.readAsBinaryString(file)
    }

    const downloadTemplate = () => {
        const template = [
            {
                'Ngày': '2026-03-06',
                'Số tiền': 500000,
                'Danh mục': 'Phí hội viên',
                'Chi nhánh': 'Lady Fit Quận 1',
                'Thanh toán': 'Tiền mặt',
                'Diễn giải': 'Thu học phí chị Lan',
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'ladyfit_revenue_template.xlsx')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-xl border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-gray-900 transition-all h-11">
                    <FileUp className="w-4 h-4 mr-2" />
                    Nhập Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-8 font-inter">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">Nhập khoản thu hàng loạt</DialogTitle>
                    <DialogDescription className="text-gray-500 text-sm">
                        Tải lên file Excel để ghi nhận nhiều khoản thu cùng lúc.
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
                                {isUploading ? 'Đang tải lên...' : 'Chọn file Excel'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">Kéo thả file vào đây</p>
                        </div>
                    </div>

                    <div className="mt-8 p-5 bg-gray-50/50 rounded-2xl border border-gray-50 flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <Download className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">Mẫu nhập liệu</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Sử dụng tên danh mục và chi nhánh chính xác có sẵn trong hệ thống.</p>
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
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="rounded-xl font-semibold text-gray-400"
                    >
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
