'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRoadmaps, fetchAllActiveRoadmapsWithClients, bulkDeleteTrainingRoadmaps } from '@/app/actions/training-roadmaps'
import { fetchClients } from '@/app/actions/clients'
import { useSearchParams, useRouter } from 'next/navigation'
import { TrainingRoadmapView } from '@/components/training-roadmaps/training-roadmap-view'
import { TrainingRoadmapBuilder } from '@/components/training-roadmaps/training-roadmap-builder'
import { ImportRoadmapDialog } from '@/components/training-roadmaps/import-roadmap-dialog'
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
    PlusCircle, 
    Search, 
    User, 
    ArrowLeft,
    Edit2,
    Loader2,
    Route,
    ChevronRight,
    FileDown,
    Plus,
    FileUp,
    Trash2
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function TrainingRoadmapPage() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const urlClientId = searchParams.get('clientId')
    const [selectedClientId, setSelectedClientId] = React.useState<string>(urlClientId || '')
    const [isBuilding, setIsBuilding] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState('')
    const [showImportDialog, setShowImportDialog] = React.useState(false)
    const [selectedIds, setSelectedIds] = React.useState<string[]>([])

    React.useEffect(() => {
        if (urlClientId) {
            setSelectedClientId(urlClientId)
        }
    }, [urlClientId])

    const { data: clients = [], isLoading: loadingClients } = useQuery({
        queryKey: ['clients-list'],
        queryFn: async () => {
            const res = await fetchClients()
            return res.success ? (res.data || []) : []
        }
    })

    // Fetch all active roadmaps for the list view
    const { data: allRoadmaps = [], isLoading: loadingAllRoadmaps } = useQuery({
        queryKey: ['all-active-roadmaps'],
        queryFn: async () => {
            const res = await fetchAllActiveRoadmapsWithClients()
            return res.success ? (res.data || []) : []
        }
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteTrainingRoadmaps,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(`Đã xóa ${selectedIds.length} lộ trình huấn luyện`)
                setSelectedIds([])
                queryClient.invalidateQueries({ queryKey: ['all-active-roadmaps'] })
            } else {
                toast.error(res.error)
            }
        }
    })

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredRoadmaps.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredRoadmaps.map((r: any) => r.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} lộ trình đã chọn?`)) return
        bulkDeleteMutation.mutate(selectedIds)
    }

    const filteredRoadmaps = React.useMemo(() => {
        return allRoadmaps.filter(r => 
            r.client?.member_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            r.goal.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [allRoadmaps, searchTerm])

    const { data: roadmaps = [], isLoading: loadingRoadmaps, refetch } = useQuery({
        queryKey: ['training-roadmaps', selectedClientId],
        queryFn: async () => {
            if (!selectedClientId) return []
            const res = await fetchRoadmaps(selectedClientId)
            return res.success ? (res.data || []) : []
        },
        enabled: !!selectedClientId
    })

    const currentRoadmap = roadmaps[0] // Get latest active roadmap

    const exportToExcel = () => {
        const dateStr = new Date().toISOString().slice(0, 10)
        if (allRoadmaps.length === 0) {
            const template = [{
                'H\u1ed9i vi\u00ean (*)': 'Nguy\u1ec5n V\u0103n A',
                'M\u1ee5c ti\u00eau': 'Gi\u1ea3m m\u1ee1 xu\u1ed1ng 15%',
                'Th\u1eddi gian': '3 th\u00e1ng',
                'Tr\u1ea1ng th\u00e1i': '\u0110ang th\u1ef1c hi\u1ec7n',
            }]
            const ws = XLSX.utils.json_to_sheet(template)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Template')
            XLSX.writeFile(wb, 'template_lo_trinh_tap_luyen.xlsx')
            toast.success('\u0110\u00e3 xu\u1ea5t file template m\u1eabu')
            return
        }
        const data = allRoadmaps.map((r: any) => ({
            'H\u1ed9i vi\u00ean': r.client?.member_name || '',
            'S\u0110T': r.client?.phone || '',
            'M\u1ee5c ti\u00eau': r.goal || '',
            'Th\u1eddi gian': r.duration_overall || '',
            'Ghi ch\u00fa': r.notes || '',
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'LoTrinhTap')
        XLSX.writeFile(wb, `lo_trinh_tap_luyen_${dateStr}.xlsx`)
        toast.success(`\u0110\u00e3 xu\u1ea5t ${data.length} l\u1ed9 tr\u00ecnh`)
    }

    return (
        <div className="space-y-6 font-inter pb-10">
            {/* Header section matching project standard */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold text-black dark:text-white flex items-center gap-2 tracking-tight">
                        <Route className="w-8 h-8 text-[#FD5771]" />
                        Lộ trình tập luyện
                    </h1>
                    <p className="text-sm text-slate-800 dark:text-gray-400 font-normal tracking-tight">Xây dựng và quản lý chiến lược huấn luyện dài hạn.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button
                        onClick={() => {
                            setSelectedClientId('')
                            setIsBuilding(true)
                        }}
                        className="bg-black hover:bg-slate-800 text-white rounded-xl h-11 px-5 font-bold transition-all shadow-sm flex items-center gap-2 grow sm:grow-0"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Thêm mới</span>
                        <span className="sm:hidden text-xs">Thêm mới</span>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setShowImportDialog(true)}
                        className="rounded-xl h-11 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px] sm:text-xs hover:bg-slate-50 dark:hover:bg-slate-800 grow sm:grow-0"
                    >
                        <FileUp className="w-4 h-4 mr-1.5 sm:mr-2" />
                        Nhập Excel
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={exportToExcel}
                        className="rounded-xl h-11 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px] sm:text-xs hover:bg-slate-50 dark:hover:bg-slate-800 grow sm:grow-0"
                    >
                        <FileDown className="w-4 h-4 mr-1.5 sm:mr-2" />
                        Xuất Excel
                    </Button>

                    <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
                        <Select value={selectedClientId} onValueChange={(val) => {
                            setSelectedClientId(val)
                            setIsBuilding(false)
                        }}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-white dark:bg-slate-800/50 text-sm font-medium">
                                <SelectValue placeholder="Xem lộ trình HV..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id} className="rounded-lg">
                                        {client.member_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedClientId && currentRoadmap && !isBuilding && (
                        <Button 
                            onClick={() => setIsBuilding(true)}
                            variant="ghost"
                            className="h-11 w-11 rounded-xl border border-slate-200 bg-white dark:bg-slate-800/50 hover:bg-red-50 text-red-600 transition-all shrink-0"
                        >
                            <Edit2 className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[60vh]">
                {isBuilding ? (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setIsBuilding(false)}
                                    className="rounded-xl h-10 gap-2 text-slate-600 hover:bg-gray-100/50 font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Quay lại
                                </Button>
                                <h2 className="text-sm font-semibold text-[#FD5771] tracking-tight">
                                    {currentRoadmap ? 'Chỉnh sửa lộ trình huấn luyện' : 'Thiết lập chiến lược mới'}
                                </h2>
                            </div>
                        </div>
                        <TrainingRoadmapBuilder 
                            initialData={currentRoadmap} 
                            onCancel={() => setIsBuilding(false)}
                            onSuccess={() => {
                                setIsBuilding(false)
                                refetch()
                            }} 
                        />
                    </div>
                ) : !selectedClientId ? (
                    <div className="space-y-6">
                        {/* List View Search & Actions */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    placeholder="Tìm tên khách hàng hoặc mục tiêu..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 font-medium text-sm"
                                />
                            </div>
                            <Button 
                                onClick={() => setIsBuilding(true)}
                                className="h-11 rounded-xl bg-slate-900 dark:bg-[#FD5771] hover:bg-slate-800 dark:hover:bg-[#E0485F] text-white px-6 font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Tạo lộ trình mới
                            </Button>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center gap-4">
                                    <Checkbox
                                        checked={selectedIds.length === filteredRoadmaps.length && filteredRoadmaps.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded-md border-red-300"
                                    />
                                    <span className="px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                        {selectedIds.length} đã chọn
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    className="h-8 text-[11px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 px-3"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    Xóa tất cả
                                </Button>
                            </div>
                        )}

                        {loadingAllRoadmaps ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium">Đang tải danh sách lộ trình...</span>
                            </div>
                        ) : allRoadmaps.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRoadmaps
                                    .map(roadmap => (
                                        <Card 
                                            key={roadmap.id} 
                                            className={cn(
                                                "group relative rounded-2xl border-none shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden bg-white dark:bg-slate-900 border",
                                                selectedIds.includes(roadmap.id) ? "border-red-500 ring-1 ring-red-500" : "border-slate-50"
                                            )}
                                            onClick={() => {
                                                setSelectedClientId(roadmap.client_id)
                                                router.push(`?clientId=${roadmap.client_id}`)
                                            }}
                                        >
                                            <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedIds.includes(roadmap.id)}
                                                    onCheckedChange={() => toggleSelect(roadmap.id)}
                                                    className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 bg-white shadow-sm"
                                                />
                                            </div>
                                            <div className={cn("p-1 w-full transition-colors", selectedIds.includes(roadmap.id) ? "bg-red-500" : "bg-[#FD5771]/10 group-hover:bg-[#FD5771]")} />
                                            <div className="p-6 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-semibold text-black dark:text-white group-hover:text-[#FD5771] transition-colors">{roadmap.client?.member_name}</h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{roadmap.client?.phone}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FD5771]/10 group-hover:text-[#FD5771] transition-all">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t border-slate-50 dark:border-slate-800">
                                                    <p className="text-[13px] font-medium text-black dark:text-slate-200 line-clamp-2 min-h-[40px] leading-relaxed">
                                                        {roadmap.goal}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tight">Thời gian: {roadmap.duration_overall}</span>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-300 group-hover:text-[#FD5771]">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                }
                            </div>
                        ) : (
                            <Card className="flex flex-col items-center justify-center py-32 bg-white dark:bg-gray-900 border-none shadow-sm rounded-xl">
                                <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-6">
                                    <Route className="w-8 h-8 text-gray-200" />
                                </div>
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-1">Chưa có lộ trình nào</h3>
                                <p className="text-sm text-slate-500 max-w-sm text-center px-6 mb-8">
                                    Hệ thống chưa ghi nhận lộ trình huấn luyện nào. Hãy chọn hội viên để bắt đầu thiết lập.
                                </p>
                            </Card>
                        )}
                    </div>
                ) : loadingRoadmaps ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-sm font-medium">Đang tải lộ trình chi tiết...</span>
                    </div>
                ) : currentRoadmap ? (
                    <div className="space-y-6">
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                setSelectedClientId('')
                                router.push('?')
                            }}
                            className="rounded-xl h-10 gap-2 text-slate-600 hover:bg-gray-100/50 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Toàn bộ danh sách
                        </Button>
                        <TrainingRoadmapView roadmap={currentRoadmap} />
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center py-32 bg-white dark:bg-gray-900 border-none shadow-sm rounded-xl">
                        <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-6">
                            <PlusCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-black dark:text-white mb-1">Hội viên chưa có lộ trình</h3>
                        <p className="text-sm text-slate-500 mb-8 max-w-sm text-center px-6">
                            Bạn chưa thiết lập lộ trình huấn luyện dài hạn cho hội viên này. Hãy bắt đầu ngay để tối ưu kết quả tập luyện.
                        </p>
                        <Button 
                            onClick={() => setIsBuilding(true)}
                            className="bg-black hover:bg-slate-800 text-white rounded-xl px-10 h-12 transition-all shadow-sm font-medium active:scale-95"
                        >
                            Thiết lập lộ trình mới
                        </Button>
                    </Card>
                )}
            </div>

            <ImportRoadmapDialog 
                open={showImportDialog} 
                onOpenChange={setShowImportDialog}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['all-active-roadmaps'] })
                }}
            />
        </div>
    )
}
