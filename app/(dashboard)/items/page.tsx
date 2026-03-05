'use client'

import * as React from 'react'
import { Plus, Search, Box, Edit2, Trash2, DollarSign, Tag, Layers } from 'lucide-react'
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

import { AddItemDialog } from '@/components/items/add-item-dialog'

export default function ItemsPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')

    const { data: items, isLoading, refetch } = useQuery({
        queryKey: ['items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('items')
                .select('*, categories(name)')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
    })

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            const { error } = await supabase.from('items').delete().eq('id', id)
            if (error) {
                toast.error('Lỗi khi xóa sản phẩm')
            } else {
                toast.success('Đã xóa sản phẩm thành công')
                refetch()
            }
        }
    }

    const filteredItems = items?.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Items (Master Data)</h1>
                    <p className="text-gray-500 mt-1">Master product catalog (Leather Codes, Types).</p>
                </div>
                <AddItemDialog onSuccess={refetch} />
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by SKU, Name..."
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
                                <TableHead className="font-bold text-gray-900">Product Info</TableHead>
                                <TableHead className="font-bold text-gray-900">Category</TableHead>
                                <TableHead className="font-bold text-gray-900">Pricing</TableHead>
                                <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredItems?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No items found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredItems?.map((item) => (
                                    <TableRow key={item.id} className="border-gray-100 group">
                                        <TableCell className="font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                                    <Box className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{item.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">{item.sku || item.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Layers className="w-3.5 h-3.5 text-gray-400" />
                                                {item.categories?.name || 'Uncategorized'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Tag className="w-3 h-3" /> Cost: <span className="text-gray-900 font-medium">${item.cost_price?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                                                    <DollarSign className="w-3 h-3" /> Sale: <span>${item.selling_price?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 rounded-full">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.id)}
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
