'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchSettings,
    updateSetting,
    createSetting,
    deleteSetting,
    type Setting
} from '@/app/actions/settings'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Settings2,
    Save,
    Trash2,
    Plus,
    Search,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AddSettingDialog } from '@/components/settings/add-setting-dialog'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = React.useState('')
    const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
    const [categorySearch, setCategorySearch] = React.useState('')
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [editValues, setEditValues] = React.useState<Partial<Setting>>({})

    const { data: settingsResult, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: fetchSettings
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Setting> }) => updateSetting(id, updates),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('Cập nhật thành công')
                setEditingId(null)
                queryClient.invalidateQueries({ queryKey: ['settings'] })
            } else {
                toast.error(result.error || 'Lỗi khi cập nhật')
            }
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteSetting(id),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('Đã xóa thông số')
                queryClient.invalidateQueries({ queryKey: ['settings'] })
            } else {
                toast.error(result.error || 'Lỗi khi xóa')
            }
        }
    })

    const groupedSettings = React.useMemo(() => {
        if (!settingsResult?.data) return {}

        const filtered = settingsResult.data.filter(s => {
            const matchesSearch = s.nam.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.categories.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.data_name.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesCategory = selectedCategory === 'all' || s.categories === selectedCategory

            return matchesSearch && matchesCategory
        })

        return filtered.reduce((acc, curr) => {
            if (!acc[curr.data_name]) acc[curr.data_name] = {}
            if (!acc[curr.data_name][curr.categories]) acc[curr.data_name][curr.categories] = []
            acc[curr.data_name][curr.categories].push(curr)
            return acc
        }, {} as Record<string, Record<string, Setting[]>>)
    }, [settingsResult, searchQuery, selectedCategory])

    const categories = React.useMemo(() => {
        if (!settingsResult?.data) return []
        const unique = Array.from(new Set(settingsResult.data.map(s => s.categories)))
        return unique.sort()
    }, [settingsResult])

    const filteredCategories = React.useMemo(() => {
        return categories.filter(cat =>
            cat.toLowerCase().includes(categorySearch.toLowerCase())
        )
    }, [categories, categorySearch])

    const dataNames = Object.keys(groupedSettings)

    const handleEdit = (setting: Setting) => {
        setEditingId(setting.id)
        setEditValues({
            nam: setting.nam,
            value: setting.value,
            default: setting.default
        })
    }

    const handleSave = (id: string) => {
        updateMutation.mutate({ id, updates: editValues })
    }

    const handleCancel = () => {
        setEditingId(null)
        setEditValues({})
    }

    return (
        <div className="space-y-6 font-inter pb-10">
            {/* Header */}
            <div className="flex flex-col gap-6 px-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <Settings2 className="w-8 h-8 text-red-600" />
                            Thiết lập Thông số
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">Cấu hình danh mục, trạng thái và tham số hệ thống toàn cục.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <AddSettingDialog />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                        <Input
                            placeholder="Tìm nhanh theo tên, module hoặc danh mục..."
                            className="pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm focus:ring-1 focus:ring-red-500 transition-all outline-none w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <DropdownMenu onOpenChange={(open) => !open && setCategorySearch('')}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full md:w-[220px] h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-sm font-medium justify-between px-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200"
                                >
                                    <span className="truncate">
                                        {selectedCategory === 'all' ? 'Tất cả phân loại' : selectedCategory}
                                    </span>
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[220px] rounded-xl border-slate-200 dark:border-slate-800 p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                            >
                                <div className="relative mb-2 px-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Tìm phân loại..."
                                        className="pl-9 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border-none text-[13px] focus:ring-0"
                                        value={categorySearch}
                                        onChange={(e) => setCategorySearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="max-h-[250px] overflow-y-auto scrollbar-hide space-y-0.5">
                                    <DropdownMenuItem
                                        onSelect={() => setSelectedCategory('all')}
                                        className={cn(
                                            "rounded-lg text-[13px] font-medium px-3 py-2 cursor-pointer transition-colors",
                                            selectedCategory === 'all' ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        Tất cả phân loại
                                    </DropdownMenuItem>
                                    {filteredCategories.map(cat => (
                                        <DropdownMenuItem
                                            key={cat}
                                            onSelect={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "rounded-lg text-[13px] font-medium px-3 py-2 cursor-pointer transition-colors",
                                                selectedCategory === cat ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {cat}
                                        </DropdownMenuItem>
                                    ))}
                                    {filteredCategories.length === 0 && (
                                        <div className="py-4 text-center text-xs text-slate-400 italic">
                                            Không tìm thấy phân loại
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setSearchQuery('')
                                setSelectedCategory('all')
                            }}
                            className="h-10 w-10 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shadow-sm transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : dataNames.length === 0 ? (
                <Card className="rounded-[2.5rem] border-none shadow-sm p-12 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Không tìm thấy thông số nào</h3>
                    <p className="text-gray-500 max-w-xs">Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại database.</p>
                </Card>
            ) : (
                <Tabs defaultValue={dataNames[0]} className="w-full">
                    <div className="overflow-x-auto pb-4 scrollbar-hide">
                        <TabsList className="bg-white/50 dark:bg-slate-900/50 p-1 rounded-xl mb-4 w-fit shadow-sm border border-slate-100 dark:border-slate-800 flex-nowrap whitespace-nowrap">
                            {dataNames.map(name => (
                                <TabsTrigger
                                    key={name}
                                    value={name}
                                    className="rounded-lg px-5 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all"
                                >
                                    {name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {dataNames.map(name => (
                        <TabsContent key={name} value={name} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {Object.entries(groupedSettings[name]).map(([category, items]) => (
                                <Card key={category} className="rounded-xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden mb-6">
                                    <CardHeader className="p-4 sm:p-6 pb-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <span className="w-1 h-5 bg-red-500 rounded-full" />
                                                    {category}
                                                </CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                                                    Module: {name} • {items.length} mục
                                                </CardDescription>
                                            </div>
                                            <AddSettingDialog defaultDataName={name} defaultCategory={category} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                                        <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-blue-300 h-9">Tên hiển thị (Nam)</TableHead>
                                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-blue-300 h-9">Giá trị (Value)</TableHead>
                                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-blue-300 h-9">Mặc định</TableHead>
                                                        <TableHead className="text-right pr-6 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-blue-300 h-9">Thao tác</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.map(item => (
                                                        <TableRow key={item.id} className="group border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                            <TableCell className="pl-6 font-semibold text-[13px] text-slate-900 dark:text-white py-2">
                                                                {editingId === item.id ? (
                                                                    <Input
                                                                        value={editValues.nam}
                                                                        onChange={e => setEditValues({ ...editValues, nam: e.target.value })}
                                                                        className="h-8 rounded-lg border-slate-200 dark:border-slate-800 focus:ring-red-500 text-sm"
                                                                    />
                                                                ) : (
                                                                    item.nam
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-[13px] font-bold text-red-600 dark:text-red-400 py-2">
                                                                {editingId === item.id ? (
                                                                    <Input
                                                                        type="number"
                                                                        value={editValues.value}
                                                                        onChange={e => setEditValues({ ...editValues, value: parseInt(e.target.value) })}
                                                                        className="h-8 w-24 rounded-lg border-slate-200 dark:border-slate-800 focus:ring-red-500 text-sm"
                                                                    />
                                                                ) : (
                                                                    item.value
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-2">
                                                                {editingId === item.id ? (
                                                                    <Input
                                                                        type="number"
                                                                        value={editValues.default || ''}
                                                                        onChange={e => setEditValues({ ...editValues, default: e.target.value ? parseInt(e.target.value) : null })}
                                                                        className="h-8 w-24 rounded-lg border-slate-200 dark:border-slate-800 focus:ring-red-500 text-sm"
                                                                        placeholder="NULL"
                                                                    />
                                                                ) : (
                                                                    item.default === 1 ? (
                                                                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md w-fit border border-emerald-100 dark:border-emerald-900/30">
                                                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                                                            <span className="text-[9px] font-bold uppercase tracking-wider">Mặc định</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>
                                                                    )
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6 py-2">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    {editingId === item.id ? (
                                                                        <>
                                                                            <Button
                                                                                onClick={() => handleSave(item.id)}
                                                                                disabled={updateMutation.isPending}
                                                                                className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
                                                                            >
                                                                                {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                                            </Button>
                                                                            <Button
                                                                                onClick={handleCancel}
                                                                                variant="ghost"
                                                                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-100 dark:bg-slate-800"
                                                                            >
                                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleEdit(item)}
                                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all sm:opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <Settings2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => {
                                                                                    if (confirm('Bạn có chắc chắn muốn xóa thông số này?')) {
                                                                                        deleteMutation.mutate(item.id)
                                                                                    }
                                                                                }}
                                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all sm:opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>
                    ))}
                </Tabs>
            )}
        </div>
    )
}
