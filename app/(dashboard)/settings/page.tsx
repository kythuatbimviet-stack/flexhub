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
    AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AddSettingDialog } from '@/components/settings/add-setting-dialog'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = React.useState('')
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

        const filtered = settingsResult.data.filter(s =>
            s.nam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.categories.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.data_name.toLowerCase().includes(searchQuery.toLowerCase())
        )

        return filtered.reduce((acc, curr) => {
            if (!acc[curr.data_name]) acc[curr.data_name] = {}
            if (!acc[curr.data_name][curr.categories]) acc[curr.data_name][curr.categories] = []
            acc[curr.data_name][curr.categories].push(curr)
            return acc
        }, {} as Record<string, Record<string, Setting[]>>)
    }, [settingsResult, searchQuery])

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
        <div className="flex flex-col gap-8 p-8 bg-gray-50/50 min-h-screen font-inter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-950 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Settings2 className="text-white w-6 h-6" />
                        </div>
                        Thiết lập Thông số
                    </h1>
                    <p className="text-gray-500 text-sm pl-1">Quản lý các danh mục, trạng thái và cấu hình hệ thống.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm thông số..."
                        className="pl-11 h-11 bg-white border-none rounded-2xl shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
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
                    <TabsList className="bg-white/50 p-1.5 rounded-2xl mb-8 w-fit shadow-sm border border-gray-100">
                        {dataNames.map(name => (
                            <TabsTrigger
                                key={name}
                                value={name}
                                className="rounded-xl px-6 py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
                            >
                                {name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {dataNames.map(name => (
                        <TabsContent key={name} value={name} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {Object.entries(groupedSettings[name]).map(([category, items]) => (
                                <Card key={category} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                                    {category}
                                                </CardTitle>
                                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-gray-400 mt-1">
                                                    Module: {name} • {items.length} mục
                                                </CardDescription>
                                            </div>
                                            <AddSettingDialog defaultDataName={name} defaultCategory={category} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-gray-50 hover:bg-transparent">
                                                    <TableHead className="pl-8 text-xs font-bold uppercase tracking-wider text-gray-400 h-14">Tên hiển thị (Nam)</TableHead>
                                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400 h-14">Giá trị (Value)</TableHead>
                                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400 h-14">Mặc định</TableHead>
                                                    <TableHead className="text-right pr-8 text-xs font-bold uppercase tracking-wider text-gray-400 h-14">Thao tác</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map(item => (
                                                    <TableRow key={item.id} className="group border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                        <TableCell className="pl-8 font-medium text-sm text-gray-900">
                                                            {editingId === item.id ? (
                                                                <Input
                                                                    value={editValues.nam}
                                                                    onChange={e => setEditValues({ ...editValues, nam: e.target.value })}
                                                                    className="h-9 rounded-lg border-gray-200 focus:ring-indigo-500"
                                                                />
                                                            ) : (
                                                                item.nam
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm font-bold text-indigo-600">
                                                            {editingId === item.id ? (
                                                                <Input
                                                                    type="number"
                                                                    value={editValues.value}
                                                                    onChange={e => setEditValues({ ...editValues, value: parseInt(e.target.value) })}
                                                                    className="h-9 w-24 rounded-lg border-gray-200 focus:ring-indigo-500"
                                                                />
                                                            ) : (
                                                                item.value
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {editingId === item.id ? (
                                                                <Input
                                                                    type="number"
                                                                    value={editValues.default || ''}
                                                                    onChange={e => setEditValues({ ...editValues, default: e.target.value ? parseInt(e.target.value) : null })}
                                                                    className="h-9 w-24 rounded-lg border-gray-200 focus:ring-indigo-500"
                                                                    placeholder="NULL"
                                                                />
                                                            ) : (
                                                                item.default === 1 ? (
                                                                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-fit border border-emerald-100">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Mặc định</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-300 text-xs">-</span>
                                                                )
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-8">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {editingId === item.id ? (
                                                                    <>
                                                                        <Button
                                                                            onClick={() => handleSave(item.id)}
                                                                            disabled={updateMutation.isPending}
                                                                            className="h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                                                                        >
                                                                            <Save className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            onClick={handleCancel}
                                                                            variant="ghost"
                                                                            className="h-9 w-9 p-0 text-gray-400 hover:text-gray-600 rounded-xl"
                                                                        >
                                                                            <RotateCcw className="w-4 h-4" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleEdit(item)}
                                                                            className="h-9 w-9 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <Settings2 className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-9 w-9 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
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
