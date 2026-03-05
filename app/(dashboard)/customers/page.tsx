'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    Mail,
    Phone,
    FileDown,
    Trash,
    CheckCircle2,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { bulkDeleteCustomers, fetchCustomers } from '@/app/actions/customers'

import { AddCustomerDialog } from '@/components/customers/add-customer-dialog'
import { ImportExcelDialog } from '@/components/customers/import-excel-dialog'
import { CustomerDetailsSheet } from '@/components/customers/customer-details-sheet'

export default function CustomersPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedCustomer, setSelectedCustomer] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

    const { data: customers, isLoading, refetch } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const result = await fetchCustomers()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const handleRowClick = (customer: any, e: React.MouseEvent) => {
        // Prevent opening sheet when clicking checkbox or dropdown
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'label'
        ) {
            return
        }
        setSelectedCustomer(customer)
        setIsDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
            const result = await bulkDeleteCustomers([id])
            if (!result.success) {
                toast.error('Lỗi khi xóa khách hàng: ' + result.error)
            } else {
                toast.success('Đã xóa khách hàng thành công')
                refetch()
            }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return

        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} khách hàng đã chọn?`)) {
            const result = await bulkDeleteCustomers(selectedRows)

            if (!result.success) {
                toast.error('Lỗi khi xóa khách hàng hàng loạt: ' + result.error)
            } else {
                toast.success(`Đã xóa thành công ${selectedRows.length} khách hàng`)
                setSelectedRows([])
                refetch()
            }
        }
    }

    const exportToExcel = () => {
        const dataToExport = customers && customers.length > 0
            ? customers.map(c => ({
                'ID': c.id,
                'Tên khách hàng': c.name,
                'Email': c.email,
                'Số điện thoại': c.phone,
                'Mã số thuế': c.tax_code,
                'Tên công ty': c.company_name,
                'Địa chỉ': c.shipping_address,
                'Địa chỉ thuế': c.tax_address || '',
                'Email nhận hóa đơn': c.email_tax || '',
                'Người đại diện': c.legal_rep,
                'Chức vụ': c.position || '',
                'Ngày tạo': new Date(c.created_at).toLocaleDateString('vi-VN')
            }))
            : [{
                'ID': '',
                'Tên khách hàng': '',
                'Email': '',
                'Số điện thoại': '',
                'Mã số thuế': '',
                'Tên công ty': '',
                'Địa chỉ': '',
                'Địa chỉ thuế': '',
                'Email nhận hóa đơn': '',
                'Người đại diện': '',
                'Chức vụ': '',
                'Ngày tạo': ''
            }]

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Customers')
        XLSX.writeFile(wb, customers && customers.length > 0 ? 'customers_list.xlsx' : 'customer_template.xlsx')
        toast.success(customers && customers.length > 0 ? 'Đã xuất file Excel thành công' : 'Đã tải file mẫu Excel')
    }

    const filteredCustomers = customers?.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedRows.length === (filteredCustomers?.length || 0)) {
            setSelectedRows([])
        } else {
            setSelectedRows(filteredCustomers?.map(c => c.id) || [])
        }
    }

    return (
        <div className="space-y-6">
            <CustomerDetailsSheet
                customer={selectedCustomer}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onSuccess={refetch}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Khách hàng</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý thông tin khách hàng và đối tác kinh doanh.</p>
                </div>
                <div className="flex items-center gap-2">
                    <AnimatePresence>
                        {selectedRows.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            >
                                <Button
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    className="rounded-xl font-bold shadow-lg shadow-red-500/20 px-4"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AddCustomerDialog onSuccess={refetch} />
                </div>
            </div>

            <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden bg-white dark:bg-gray-900 transition-all duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row gap-4 justify-between bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm khách hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm h-11 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <ImportExcelDialog onSuccess={refetch} />
                        <Button
                            variant="outline"
                            onClick={exportToExcel}
                            className="rounded-xl border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium h-11"
                        >
                            <FileDown className="w-4 h-4 mr-2" />
                            Xuất Excel
                        </Button>
                        <Button variant="outline" className="rounded-xl border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium h-11">
                            <Filter className="w-4 h-4 mr-2" />
                            Lọc
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-gray-800/30">
                            <TableRow className="border-gray-100 dark:border-gray-800 hover:bg-transparent">
                                <TableHead className="w-12 pl-4">
                                    <Checkbox
                                        checked={selectedRows.length === (filteredCustomers?.length || 0) && (filteredCustomers?.length || 0) > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-md border-gray-300 dark:border-gray-600"
                                    />
                                </TableHead>
                                <TableHead className="font-bold text-gray-900 dark:text-gray-100 py-4 text-sm">Khách hàng</TableHead>
                                <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-sm">Địa chỉ & Liên hệ</TableHead>
                                <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-sm">Phân loại</TableHead>
                                <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-sm">Mã số thuế</TableHead>
                                <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-right pr-6 text-sm">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                            <span>Đang tải danh sách...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredCustomers?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Search className="w-10 h-10 text-gray-200 dark:text-gray-800" />
                                            <p className="font-medium">Không tìm thấy khách hàng nào.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers?.map((customer) => (
                                    <TableRow
                                        key={customer.id}
                                        onClick={(e) => handleRowClick(customer, e)}
                                        className={cn(
                                            "border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all group cursor-pointer",
                                            selectedRows.includes(customer.id) && "bg-blue-50/30 dark:bg-blue-900/10"
                                        )}
                                    >
                                        <TableCell className="pl-4">
                                            <Checkbox
                                                checked={selectedRows.includes(customer.id)}
                                                onCheckedChange={() => toggleRow(customer.id)}
                                                className="rounded-md border-gray-300 dark:border-gray-600"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100 py-5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    {customer.name}
                                                    {selectedRows.includes(customer.id) && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal uppercase tracking-widest">{customer.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[200px]">{customer.email || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    <span>{customer.phone || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none rounded-lg px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider">
                                                Customer
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                                            {customer.tax_code || '-'}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                                        <MoreHorizontal className="h-4.5 w-4.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-2xl border-gray-100 dark:border-gray-800 shadow-xl bg-white dark:bg-gray-900 p-1.5 z-50">
                                                    <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Thao tác</DropdownMenuLabel>
                                                    <DropdownMenuItem className="cursor-pointer gap-2.5 px-3 py-2.5 rounded-xl transition-all focus:bg-blue-50 dark:focus:bg-blue-900/30 font-medium text-sm">
                                                        <Edit2 className="w-4 h-4 text-blue-500" /> Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800 mx-1 my-1" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(customer.id)}
                                                        className="text-red-600 dark:text-red-400 cursor-pointer gap-2.5 px-3 py-2.5 rounded-xl transition-all focus:bg-red-50 dark:focus:bg-red-900/20 font-medium text-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Xóa bản ghi
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold tracking-wide">
                        Hiển thị {filteredCustomers?.length || 0} kết quả
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 border-gray-200 dark:border-gray-700 font-bold text-xs disabled:opacity-30 transition-all hover:bg-white dark:hover:bg-gray-800" disabled>
                            Trang trước
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 border-gray-200 dark:border-gray-700 font-bold text-xs disabled:opacity-30 transition-all hover:bg-white dark:hover:bg-gray-800" disabled>
                            Trang sau
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
