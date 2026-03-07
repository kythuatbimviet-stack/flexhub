'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchConfigParams,
    updateConfigParam,
    deleteConfigParam,
    type ConfigItem
} from '@/app/actions/config-params'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    Plus,
    AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ParamDialog } from './param-dialog'

interface ParamTableProps {
    tableName: string
    searchTerm: string
    groupColor: string
    groupBg: string
}

export function ParamTable({ tableName, searchTerm, groupColor, groupBg }: ParamTableProps) {
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<ConfigItem | null>(null)

    const { data: result, isLoading, error } = useQuery({
        queryKey: ['config-params', tableName],
        queryFn: () => fetchConfigParams(tableName)
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteConfigParam(tableName, id),
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Xóa tham số thành công')
                queryClient.invalidateQueries({ queryKey: ['config-params', tableName] })
            } else {
                toast.error(res.error || 'Lỗi khi xóa')
            }
        }
    })

    const filteredData = React.useMemo(() => {
        if (!result?.data) return []
        return result.data.filter(item =>
            item.nam?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [result?.data, searchTerm])

    const handleDelete = (id: number) => {
        if (confirm('Bạn có chắc chắn muốn xóa tham số này?')) {
            deleteMutation.mutate(id)
        }
    }

    const handleEdit = (item: ConfigItem) => {
        setEditingItem(item)
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        setEditingItem(null)
        setIsDialogOpen(true)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <span className="text-sm font-medium">Đang tải dữ liệu...</span>
            </div>
        )
    }

    if (!result?.success) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
                <AlertCircle className="w-10 h-10" />
                <span className="text-sm font-semibold">{result?.error || 'Lỗi khi tải dữ liệu'}</span>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['config-params', tableName] })}>
                    Thử lại
                </Button>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="absolute top-[-52px] right-6">
                <Button
                    onClick={handleAdd}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 h-9 shadow-lg shadow-red-500/20 text-xs font-semibold"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm mới
                </Button>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="border-b border-gray-100 dark:border-gray-800">
                            <TableHead className="w-[80px] text-center font-bold text-gray-400 uppercase tracking-widest text-[10px]">Thứ tự</TableHead>
                            <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Tên hiển thị</TableHead>
                            <TableHead className="w-[120px] text-center font-bold text-gray-400 uppercase tracking-widest text-[10px]">Mặc định</TableHead>
                            <TableHead className="w-[100px] text-right font-bold text-gray-400 uppercase tracking-widest text-[10px]">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                                <TableRow key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-rose-50/50 dark:border-gray-800/50 last:border-0">
                                    <TableCell className="text-center">
                                        <span className={cn("px-2 py-1 rounded-md text-[11px] font-bold", groupBg, groupColor)}>
                                            {item.value || 0}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-semibold text-gray-700 dark:text-gray-300">
                                        {item.nam}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {item.is_default ? (
                                            <div className="flex justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/30" />
                                            </div>
                                        ) : (
                                            <div className="flex justify-center opacity-10">
                                                <XCircle className="w-5 h-5 text-gray-300" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(item)}
                                                className="w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item.id)}
                                                className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-gray-400 text-sm italic">
                                    Không tìm thấy tham số nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <ParamDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                tableName={tableName}
                item={editingItem}
                groupColor={groupColor}
                groupBg={groupBg}
            />
        </div>
    )
}
