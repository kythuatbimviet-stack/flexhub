'use client'

import * as React from 'react'
import { Plus, Search, ClipboardList, Edit2, Trash2, Box, Warehouse, Ruler, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
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
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    'Còn hàng': { label: 'Còn hàng', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    'Đã bán': { label: 'Đã bán', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Box },
    'Giữ chỗ': { label: 'Giữ chỗ', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
}

import { BatchInventoryDialog } from '@/components/inventory/batch-inventory-dialog'

export default function InventoryPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [statusFilter, setStatusFilter] = React.useState('all')

    const { data: inventory, isLoading, refetch } = useQuery({
        queryKey: ['inventory', statusFilter],
        queryFn: async () => {
            let query = supabase
                .from('inventory')
                .select(`
          *,
          items (name, sku),
          warehouses (name)
        `)
                .order('created_at', { ascending: false })

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            }

            const { data, error } = await query
            if (error) throw error
            return data
        },
    })

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa tấm da này khỏi hệ thống?')) {
            const { error } = await supabase.from('inventory').delete().eq('id', id)
            if (error) {
                toast.error('Lỗi khi xóa tồn kho')
            } else {
                toast.success('Đã xóa thành công')
                refetch()
            }
        }
    }

    const filteredInventory = inventory?.filter(inv =>
        inv.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.items?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.items?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory</h1>
                    <p className="text-gray-500 mt-1">Piece-level tracking (Unique Barcode & Area).</p>
                </div>
                <BatchInventoryDialog onSuccess={refetch} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-none shadow-sm rounded-2xl bg-emerald-50/50">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Tổng diện tích khả dụng</p>
                    <h3 className="text-2xl font-bold text-emerald-900">
                        {inventory?.filter(i => i.status === 'Còn hàng').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
                        <span className="text-sm font-normal ml-1 text-emerald-600">sqft</span>
                    </h3>
                </Card>
                <Card className="p-4 border-none shadow-sm rounded-2xl bg-amber-50/50">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Đang giữ chỗ</p>
                    <h3 className="text-2xl font-bold text-amber-900">
                        {inventory?.filter(i => i.status === 'Giữ chỗ').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
                        <span className="text-sm font-normal ml-1 text-amber-600">sqft</span>
                    </h3>
                </Card>
                <Card className="p-4 border-none shadow-sm rounded-2xl bg-blue-50/50">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Tổng số tấm (Pieces)</p>
                    <h3 className="text-2xl font-bold text-blue-900">
                        {inventory?.length || 0}
                        <span className="text-sm font-normal ml-1 text-blue-600">tấm</span>
                    </h3>
                </Card>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="flex flex-1 gap-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Tìm mã tấm, tên sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white border-gray-200 rounded-xl focus:ring-blue-500"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] rounded-xl border-gray-200 bg-white">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100">
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="Còn hàng">Còn hàng</SelectItem>
                                <SelectItem value="Giữ chỗ">Giữ chỗ</SelectItem>
                                <SelectItem value="Đã bán">Đã bán</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-gray-100 hover:bg-transparent">
                                <TableHead className="font-bold text-gray-900">Inventory ID</TableHead>
                                <TableHead className="font-bold text-gray-900">Product (SKU)</TableHead>
                                <TableHead className="font-bold text-gray-900">Amount (Size)</TableHead>
                                <TableHead className="font-bold text-gray-900">Warehouse</TableHead>
                                <TableHead className="font-bold text-gray-900">Status</TableHead>
                                <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">Loading inventory data...</TableCell>
                                </TableRow>
                            ) : filteredInventory?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">No pieces found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredInventory?.map((inv) => {
                                    const status = statusMap[inv.status] || { label: inv.status, color: 'bg-gray-100', icon: AlertCircle }
                                    return (
                                        <TableRow key={inv.id} className="border-gray-100 group hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono text-[10px] py-0 h-5 border-gray-200 text-gray-500">
                                                        ID
                                                    </Badge>
                                                    <span className="font-bold text-gray-900">{inv.id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">{inv.items?.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">{inv.items?.sku}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-gray-900 font-bold">
                                                    <Ruler className="w-3.5 h-3.5 text-blue-500" />
                                                    {inv.amount} <span className="text-[10px] font-normal text-gray-400 uppercase">{inv.unit}</span>
                                                    {inv.is_defect && (
                                                        <Badge variant="destructive" className="ml-2 text-[8px] h-4 px-1 rounded-sm flex items-center gap-0.5">
                                                            <AlertCircle className="w-2.5 h-2.5" /> Lỗ gù
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <Warehouse className="w-3.5 h-3.5 text-gray-400" />
                                                    {inv.warehouses?.name || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${status.color} border shadow-none flex items-center gap-1 w-fit rounded-lg px-2 py-0.5 font-medium`}>
                                                    <status.icon className="w-3 h-3" />
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 rounded-full">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(inv.id)}
                                                        className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-full"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
