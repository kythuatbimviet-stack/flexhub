'use client'

import * as React from 'react'
import { Plus, Search, Package, Edit2, Trash2, ShoppingBag, Truck, Calendar, Ruler, CheckCircle2, QrCode, Clock } from 'lucide-react'
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
    'Preparing': { label: 'Đang chuẩn bị', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    'Packed': { label: 'Đã đóng xong', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Package },
    'Shipped': { label: 'Đã xuất kho', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Truck },
}

import { CreatePackageDialog } from '@/components/packing/create-package-dialog'

export default function PackingPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')

    const { data: packages, isLoading, refetch } = useQuery({
        queryKey: ['packages'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('packages')
                .select(`
          *,
          orders (id, customers (name))
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
    })

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa kiện hàng này?')) {
            const { error } = await supabase.from('packages').delete().eq('id', id)
            if (error) {
                toast.error('Lỗi khi xóa kiện hàng')
            } else {
                toast.success('Đã xóa thành công')
                refetch()
            }
        }
    }

    const filteredPackages = packages?.filter(p =>
        p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.orders?.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.orders?.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Packing & Logistics</h1>
                    <p className="text-gray-500 mt-1">Manage shipments and package piece-level details.</p>
                </div>
                <CreatePackageDialog onSuccess={refetch} />
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search Packages, Orders..."
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
                                <TableHead className="font-bold text-gray-900">Package ID</TableHead>
                                <TableHead className="font-bold text-gray-900">Order Ref</TableHead>
                                <TableHead className="font-bold text-gray-900">Customer</TableHead>
                                <TableHead className="font-bold text-gray-900">Created At</TableHead>
                                <TableHead className="font-bold text-gray-900">Weight/Area</TableHead>
                                <TableHead className="font-bold text-gray-900">Status</TableHead>
                                <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">Loading packages...</TableCell>
                                </TableRow>
                            ) : filteredPackages?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">No packages found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredPackages?.map((p) => {
                                    const status = statusMap[p.status] || { label: p.status, color: 'bg-gray-100', icon: Package }
                                    return (
                                        <TableRow key={p.id} className="border-gray-100 group">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <QrCode className="w-4 h-4 text-gray-400" />
                                                    <span className="font-bold text-gray-900 uppercase">{p.id.split('-')[0]}...</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="rounded-lg border-blue-100 text-blue-600 bg-blue-50/50">
                                                    #{p.order_id?.split('-')[0]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-gray-700">
                                                {p.orders?.customers?.name}
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-xs">
                                                {format(new Date(p.created_at), 'dd/MM/yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{p.total_weight || 0}kg</span>
                                                    <span className="text-[10px] text-gray-400">Net Weight</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${status.color} border shadow-none flex items-center gap-1 w-fit rounded-lg px-2 py-0.5 font-medium`}>
                                                    <status.icon className="w-3 h-3" />
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 rounded-full">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(p.id)}
                                                        className="h-8 w-8 hover:text-red-500 rounded-full"
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
