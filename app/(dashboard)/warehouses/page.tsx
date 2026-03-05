'use client'

import * as React from 'react'
import { Plus, Search, Warehouse, Edit2, Trash2, MapPin, Info } from 'lucide-react'
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

import { AddWarehouseDialog } from '@/components/warehouses/add-warehouse-dialog'

export default function WarehousesPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')

    const { data: warehouses, isLoading, refetch } = useQuery({
        queryKey: ['warehouses'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('warehouses')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
    })

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa kho này?')) {
            const { error } = await supabase.from('warehouses').delete().eq('id', id)
            if (error) {
                toast.error('Lỗi khi xóa kho')
            } else {
                toast.success('Đã xóa kho thành công')
                refetch()
            }
        }
    }

    const filteredWarehouses = warehouses?.filter(w =>
        w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Warehouses</h1>
                    <p className="text-gray-500 mt-1">Manage storage locations and logistics hubs.</p>
                </div>
                <AddWarehouseDialog onSuccess={refetch} />
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search warehouses..."
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
                                <TableHead className="font-bold text-gray-900">Warehouse Name</TableHead>
                                <TableHead className="font-bold text-gray-900">Address</TableHead>
                                <TableHead className="font-bold text-gray-900">Description</TableHead>
                                <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">Loading...</TableCell>
                                </TableRow>
                            ) : filteredWarehouses?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">No warehouses found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredWarehouses?.map((w) => (
                                    <TableRow key={w.id} className="border-gray-100 group">
                                        <TableCell className="font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                                    <Warehouse className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{w.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{w.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600 max-w-xs truncate">
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate">{w.address || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-500 italic text-xs">
                                            {w.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 rounded-full">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(w.id)}
                                                    className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-full"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
