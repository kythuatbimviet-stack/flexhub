'use client'

import * as React from 'react'
import { Plus, Search, ShoppingBag, Edit2, Trash2, User, DollarSign, Calendar, Clock, CheckCircle2, XCircle, Truck, Package } from 'lucide-react'
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
import { format } from 'date-fns'

const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    'Confirmed': { label: 'Đã xác nhận', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    'Packaging': { label: 'Đang đóng gói', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Package },
    'Shipped': { label: 'Đang giao', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Truck },
    'Delivered': { label: 'Đã giao', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: CheckCircle2 },
    'Cancelled': { label: 'Đã hủy', color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
}

import { CreateOrderDialog } from '@/components/orders/create-order-dialog'

export default function OrdersPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')

    const { data: orders, isLoading, refetch } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          customers (name, company_name)
        `)
                .order('order_date', { ascending: false })

            if (error) throw error
            return data
        },
    })

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
            const { error } = await supabase.from('orders').delete().eq('id', id)
            if (error) {
                toast.error('Lỗi khi xóa đơn hàng')
            } else {
                toast.success('Đã xóa thành công')
                refetch()
            }
        }
    }

    const filteredOrders = orders?.filter(o =>
        o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customers?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sales Orders</h1>
                    <p className="text-gray-500 mt-1">Track customer orders, fulfillment, and payments.</p>
                </div>
                <CreateOrderDialog onSuccess={refetch} />
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search Orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white border-gray-200 rounded-xl focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-gray-100 hover:bg-transparent">
                                <TableHead className="font-bold text-gray-900">Order ID</TableHead>
                                <TableHead className="font-bold text-gray-900">Customer</TableHead>
                                <TableHead className="font-bold text-gray-900">Order Date</TableHead>
                                <TableHead className="font-bold text-gray-900">Total Value</TableHead>
                                <TableHead className="font-bold text-gray-900">Status</TableHead>
                                <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">Loading orders...</TableCell>
                                </TableRow>
                            ) : filteredOrders?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">No orders found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders?.map((o) => {
                                    const status = statusMap[o.status] || { label: o.status, color: 'bg-gray-100', icon: Clock }
                                    return (
                                        <TableRow key={o.id} className="border-gray-100 group">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                                                    <span className="font-bold text-gray-900">#{o.id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">{o.customers?.name}</span>
                                                    <span className="text-[10px] text-gray-400 capitalize">{o.customers?.company_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    {format(new Date(o.order_date), 'dd/MM/yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-gray-900 font-bold">
                                                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                                    {o.total_amount?.toLocaleString()}
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
                                                        onClick={() => handleDelete(o.id)}
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
