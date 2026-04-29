'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
    fetchTrainingResults, 
    createTrainingResult, 
    updateTrainingResult, 
    deleteTrainingResult,
    TrainingResult 
} from '@/app/actions/training-results'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
    PlusCircle, 
    History, 
    Trash2, 
    Edit2, 
    Save, 
    X,
    ClipboardList,
    TrendingUp,
    Scale,
    Dumbbell,
    Activity,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface TrainingResultsPanelProps {
    clientId: string
}

export function TrainingResultsPanel({ clientId }: TrainingResultsPanelProps) {
    const queryClient = useQueryClient()
    const [isAdding, setIsAdding] = React.useState(false)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [formData, setFormData] = React.useState<Partial<TrainingResult>>({
        client_id: clientId,
        phase: '',
        measurement_num: 1,
        measurement_date: new Date().toISOString().split('T')[0],
        measurement_chest: 0,
        measurement_bicep_left: 0,
        measurement_bicep_right: 0,
        measurement_waist: 0,
        measurement_hip: 0,
        measurement_thigh_left: 0,
        measurement_thigh_right: 0,
        muscle_mass: 0,
        body_fat: 0
    })

    const { data: results = [], isLoading } = useQuery({
        queryKey: ['training-results', clientId],
        queryFn: () => fetchTrainingResults(clientId).then(res => res.data || [])
    })

    const createMutation = useMutation({
        mutationFn: createTrainingResult,
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Đã lưu kết quả tập luyện')
                setIsAdding(false)
                queryClient.invalidateQueries({ queryKey: ['training-results', clientId] })
            } else {
                toast.error('Lỗi: ' + res.error)
            }
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<TrainingResult> }) => 
            updateTrainingResult(id, updates),
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Đã cập nhật kết quả')
                setEditingId(null)
                queryClient.invalidateQueries({ queryKey: ['training-results', clientId] })
            } else {
                toast.error('Lỗi: ' + res.error)
            }
        }
    })

    const deleteMutation = useMutation({
        mutationFn: deleteTrainingResult,
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Đã xóa bản ghi')
                queryClient.invalidateQueries({ queryKey: ['training-results', clientId] })
            } else {
                toast.error('Lỗi: ' + res.error)
            }
        }
    })

    const handleSubmit = () => {
        if (!formData.phase) {
            toast.error('Vui lòng nhập giai đoạn')
            return
        }
        createMutation.mutate(formData)
    }

    const handleUpdate = () => {
        if (!editingId) return
        updateMutation.mutate({ id: editingId, updates: formData })
    }

    const startEdit = (result: TrainingResult) => {
        setEditingId(result.id)
        setFormData(result)
        setIsAdding(false)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setIsAdding(false)
        setFormData({
            client_id: clientId,
            phase: '',
            measurement_num: (results[0]?.measurement_num || 0) + 1,
            measurement_date: new Date().toISOString().split('T')[0],
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                        <Scale className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Lịch sử đo lường tập luyện</h3>
                        <p className="text-[11px] text-slate-500">Theo dõi sự thay đổi của các chỉ số qua từng giai đoạn</p>
                    </div>
                </div>
                {!isAdding && !editingId && (
                    <Button 
                        size="sm" 
                        onClick={() => {
                            setIsAdding(true)
                            setFormData({
                                client_id: clientId,
                                phase: '',
                                measurement_num: (results[0]?.measurement_num || 0) + 1,
                                measurement_date: new Date().toISOString().split('T')[0],
                                measurement_chest: 0,
                                measurement_bicep_left: 0,
                                measurement_bicep_right: 0,
                                measurement_waist: 0,
                                measurement_hip: 0,
                                measurement_thigh_left: 0,
                                measurement_thigh_right: 0,
                                muscle_mass: 0,
                                body_fat: 0
                            })
                        }}
                        className="h-8 rounded-lg bg-orange-600 hover:bg-orange-700 text-white gap-2 text-xs font-bold"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Thêm lần đo mới
                    </Button>
                )}
            </div>

            {(isAdding || editingId) && (
                <Card className="p-5 border-2 border-orange-100 dark:border-orange-900/30 bg-orange-50/10 dark:bg-orange-950/5 overflow-hidden">
                    <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-2">
                            <PlusCircle className="w-3.5 h-3.5" />
                            {editingId ? 'Cập nhật kết quả' : 'Nhập kết quả đo lường mới'}
                        </h4>
                        <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-6 w-6 rounded-full hover:bg-orange-100 text-slate-400">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5 col-span-1">
                            <Label className="text-[11px] font-medium text-slate-500">Giai đoạn</Label>
                            <Input 
                                value={formData.phase || ''} 
                                onChange={e => setFormData({...formData, phase: e.target.value})}
                                placeholder="VD: Phase 1" 
                                className="h-9 text-xs rounded-lg border-slate-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Lần đo</Label>
                            <Input 
                                type="number" 
                                value={formData.measurement_num || ''} 
                                onChange={e => setFormData({...formData, measurement_num: parseInt(e.target.value)})}
                                className="h-9 text-xs rounded-lg border-slate-200"
                            />
                        </div>
                        <div className="space-y-1.5 col-span-2 sm:col-span-2">
                            <Label className="text-[11px] font-medium text-slate-500">Ngày đo</Label>
                            <Input 
                                type="date" 
                                value={formData.measurement_date || ''} 
                                onChange={e => setFormData({...formData, measurement_date: e.target.value})}
                                className="h-9 text-xs rounded-lg border-slate-200"
                            />
                        </div>

                        <div className="col-span-full border-t border-orange-100 dark:border-orange-900/20 my-1 pt-3">
                            <p className="text-[10px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3">Số đo các vòng (cm)</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Ngực</Label>
                            <Input type="number" value={formData.measurement_chest || ''} onChange={e => setFormData({...formData, measurement_chest: parseFloat(e.target.value)})} className="h-9 text-xs rounded-lg border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Bụng</Label>
                            <Input type="number" value={formData.measurement_waist || ''} onChange={e => setFormData({...formData, measurement_waist: parseFloat(e.target.value)})} className="h-9 text-xs rounded-lg border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Mông</Label>
                            <Input type="number" value={formData.measurement_hip || ''} onChange={e => setFormData({...formData, measurement_hip: parseFloat(e.target.value)})} className="h-9 text-xs rounded-lg border-slate-200" />
                        </div>
                        <div className="space-y-1.5" />

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Bắp tay trái</Label>
                            <Input type="number" value={formData.measurement_bicep_left || ''} onChange={e => setFormData({...formData, measurement_bicep_left: parseFloat(e.target.value)})} className="h-9 text-xs rounded-lg border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Bắp tay phải</Label>
                            <Input type="number" value={formData.measurement_bicep_right || ''} onChange={e => setFormData({...formData, measurement_bicep_right: parseFloat(e.target.value)})} className="h-9 text-xs rounded-lg border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Bắp đùi trái</Label>
                            <Input type="number" value={formData.measurement_thigh_left || ''} onChange={e => setFormData({...formData, measurement_thigh_left: parseFloat(e.target.value)})} className="h-9 text-xs rounded-lg border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Bắp đùi phải</Label>
                            <Input type="number" value={formData.measurement_thigh_right || ''} onChange={e => setFormData({...formData, measurement_thigh_right: parseFloat(e.target.value)})} className="h-9 text-xs rounded-lg border-slate-200" />
                        </div>

                        <div className="col-span-full border-t border-orange-100 dark:border-orange-900/20 my-1 pt-3">
                            <p className="text-[10px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3">Chỉ số thành phần cơ thể</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Lượng cơ (kg)</Label>
                            <Input type="number" value={formData.muscle_mass || ''} onChange={e => setFormData({...formData, muscle_mass: parseFloat(e.target.value)})} className="h-9 text-xs rounded-lg border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-slate-500">Bodyfat (%)</Label>
                            <Input type="number" value={formData.body_fat || ''} onChange={e => setFormData({...formData, body_fat: parseFloat(e.target.value)})} className="h-9 text-xs rounded-lg border-slate-200" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-xs h-8">Hủy</Button>
                        <Button 
                            size="sm" 
                            onClick={editingId ? handleUpdate : handleSubmit}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8 px-4 font-bold"
                        >
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                            {editingId ? 'Cập nhật' : 'Lưu kết quả'}
                        </Button>
                    </div>
                </Card>
            )}

            <div className="space-y-3">
                {results.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <Scale className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Chưa có dữ liệu kết quả tập luyện</p>
                    </div>
                ) : (
                    results.map((result, idx) => (
                        <Card key={result.id} className="p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group hover:shadow-md transition-all rounded-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                                        L{result.measurement_num}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {result.phase}
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                {format(new Date(result.measurement_date), 'dd/MM/yyyy')}
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                            <History className="w-3 h-3" />
                                            Ghi nhận bởi: {result.created_by}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => startEdit(result)} className="h-7 w-7 rounded-lg text-blue-500 hover:bg-blue-50">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => {
                                            if (confirm('Bạn có chắc muốn xóa kết quả này?')) {
                                                deleteMutation.mutate(result.id)
                                            }
                                        }} 
                                        className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-y-3 gap-x-2">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">Ngực</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{result.measurement_chest} cm</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">Bụng</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{result.measurement_waist} cm</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">Mông</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{result.measurement_hip} cm</span>
                                </div>
                                <div className="hidden sm:block" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">Cơ (kg)</span>
                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{result.muscle_mass}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">Fat (%)</span>
                                    <span className="text-xs font-bold text-red-500">{result.body_fat}</span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">Tay T/P</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{result.measurement_bicep_left} / {result.measurement_bicep_right}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">Đùi T/P</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{result.measurement_thigh_left} / {result.measurement_thigh_right}</span>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
