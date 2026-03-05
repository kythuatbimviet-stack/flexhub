'use client'

import * as React from 'react'
import { Plus, Search, Layers, Edit2, Trash2, Globe, Ruler } from 'lucide-react'
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

import { AddCategoryDialog } from '@/components/categories/add-category-dialog'

export default function CategoriesPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = React.useState('')

    const { data: categories, isLoading, refetch } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
    })

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
            const { error } = await supabase.from('categories').delete().eq('id', id)
            if (error) {
                toast.error('Lỗi khi xóa danh mục')
            } else {
                toast.success('Đã xóa danh mục thành công')
                refetch()
            }
        }
    }

    const filteredCategories = categories?.filter(cat =>
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Categories</h1>
                    <p className="text-gray-500 mt-1">Manage leather collections and specifications.</p>
                </div>
                <AddCategoryDialog onSuccess={refetch} />
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search categories..."
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
                                <TableHead className="font-bold text-gray-900">Name</TableHead>
                                <TableHead className="font-bold text-gray-900">Specifications</TableHead>
                                <TableHead className="font-bold text-gray-900">Origin</TableHead>
                                <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredCategories?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No categories found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories?.map((cat) => (
                                    <TableRow key={cat.id} className="border-gray-100 group">
                                        <TableCell className="font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                    <Layers className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span>{cat.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{cat.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-500 font-normal">
                                                    {cat.grain || 'No grain'}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-500 font-normal">
                                                    {cat.thickness || 'No thickness'}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Globe className="w-3.5 h-3.5 text-gray-400" />
                                                {cat.country_origin || 'Unknown'}
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
                                                    onClick={() => handleDelete(cat.id)}
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
