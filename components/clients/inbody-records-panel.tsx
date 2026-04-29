'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
    fetchClientInBodyRecords, 
    createInBodyRecord, 
    deleteInBodyRecord 
} from '@/app/actions/inbody-records'
import { 
    Plus, 
    History, 
    ChevronRight, 
    Trash2, 
    Loader2, 
    FileText,
    Activity,
    Scale
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InBodyReportView } from './inbody-report-view'
import { ScrollArea } from '@/components/ui/scroll-area'

interface InBodyRecordsPanelProps {
    client: any
}

export function InBodyRecordsPanel({ client }: InBodyRecordsPanelProps) {
    const queryClient = useQueryClient()
    const [selectedRecord, setSelectedRecord] = React.useState<any>(null)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    const { data: records = [], isLoading } = useQuery({
        queryKey: ['inbody-records', client.id],
        queryFn: () => fetchClientInBodyRecords(client.id).then(res => res.data || []),
        enabled: !!client.id
    })

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())
        
        // Convert numbers
        const numericData: any = { client_id: client.id }
        Object.keys(data).forEach(key => {
            if (key === 'recorded_at' || key === 'gender' || key === 'notes') {
                numericData[key] = data[key]
            } else {
                numericData[key] = data[key] ? parseFloat(data[key] as string) : null
            }
        })

        try {
            const res = await createInBodyRecord(numericData)
            if (res.success) {
                toast.success('Đã lưu kết quả InBody mới')
                setIsAddOpen(false)
                queryClient.invalidateQueries({ queryKey: ['inbody-records', client.id] })
            } else {
                toast.error('Lỗi: ' + res.error)
            }
        } catch (error: any) {
            toast.error('Lỗi hệ thống: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return
        try {
            const res = await deleteInBodyRecord(id)
            if (res.success) {
                toast.success('Đã xóa bản ghi')
                queryClient.invalidateQueries({ queryKey: ['inbody-records', client.id] })
                if (selectedRecord?.id === id) setSelectedRecord(null)
            }
        } catch (err: any) {
            toast.error('Lỗi xóa')
        }
    }

    if (selectedRecord) {
        return (
            <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden relative">
                <div className="absolute top-4 left-4 z-50">
                    <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)} className="rounded-xl shadow-lg bg-white/90 backdrop-blur">
                        Quay lại danh sách
                    </Button>
                </div>
                <ScrollArea className="flex-1 h-full">
                    <InBodyReportView data={selectedRecord} client={client} />
                </ScrollArea>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="space-y-0.5">
                    <h3 className="text-sm font-medium text-black dark:text-white tracking-tight flex items-center gap-2">
                        <Activity className="w-4 h-4 text-red-500" />
                        Lịch sử đo InBody
                    </h3>
                    <p className="text-[11px] text-black/60 dark:text-white/60 font-normal">Theo dõi biến động các chỉ số thành phần cơ thể</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium h-9 gap-1.5 shadow-lg shadow-red-200/50">
                    <Plus className="w-4 h-4" />
                    Thêm kết quả
                </Button>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-300">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm font-medium text-black/40">Đang tải dữ liệu...</span>
                </div>
            ) : records.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-slate-100 rounded-3xl">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                        <Scale className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-black/60 text-sm font-medium tracking-tight">Chưa có kết quả đo InBody nào</p>
                    <Button variant="ghost" onClick={() => setIsAddOpen(true)} className="mt-4 text-red-600 font-medium hover:bg-red-50 rounded-xl h-10 px-6">Bắt đầu đo ngay</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {records.map((record: any) => (
                        <div 
                            key={record.id}
                            onClick={() => setSelectedRecord(record)}
                            className="bg-white hover:bg-red-50/30 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:shadow-md hover:border-red-100 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/10 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 leading-none">{format(new Date(record.recorded_at), 'MMM')}</span>
                                    <span className="text-xl font-medium text-orange-700 dark:text-orange-300 leading-none">{format(new Date(record.recorded_at), 'dd')}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-black dark:text-white">{record.weight} kg</span>
                                        <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">{record.pbf}% mỡ</span>
                                    </div>
                                    <div className="text-[11px] text-black/50 dark:text-white/50 font-normal">BMR: {record.bmr} kcal · Điểm: {record.fitness_score}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={(e) => handleDelete(record.id, e)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-red-300 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD RECORD DIALOG */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl bg-[#f8f9fa]">
                    <DialogHeader className="p-6 pb-4 bg-white border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
                                <Scale className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-medium text-black dark:text-white tracking-tight">Nhập chỉ số InBody</DialogTitle>
                                <DialogDescription className="text-xs font-normal text-black/60 dark:text-white/60 mt-1">Ghi chú kết quả đo từ thiết bị</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleAdd} className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-8">
                            {/* SECTION 1: CƠ BẢN */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-medium text-black/40 dark:text-white/40 tracking-[2px] mb-4">Thông tin cơ bản & Tổng quan</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-black dark:text-white">Ngày đo</Label>
                                        <Input type="datetime-local" name="recorded_at" defaultValue={new Date().toISOString().slice(0, 16)} className="rounded-xl border-slate-200 h-11" required />
                                    </div>
                                    <FormGroup label="Cân nặng (kg)" name="weight" defaultValue={client.weight} />
                                    <FormGroup label="Chiều cao (cm)" name="height" defaultValue={client.height} />
                                    <FormGroup label="Tuổi" name="age" defaultValue={client.age} />
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-black dark:text-white">Giới tính</Label>
                                        <Input name="gender" defaultValue={client.gender} className="rounded-xl border-slate-200 h-11" />
                                    </div>
                                    <FormGroup label="Điểm thể trạng" name="fitness_score" />
                                </div>
                            </div>

                            {/* SECTION 2: THÀNH PHẦN */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h4 className="text-[10px] font-medium text-black/40 dark:text-white/40 tracking-[2px] mb-4">Thành phần & Chỉ số</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <FormGroup label="Nước (L)" name="body_water" />
                                    <FormGroup label="Protein (kg)" name="protein" />
                                    <FormGroup label="Khoáng (kg)" name="minerals" />
                                    <FormGroup label="Khối mỡ (kg)" name="body_fat_mass" />
                                    <FormGroup label="Cơ xương (kg)" name="smm" />
                                    <FormGroup label="BMI" name="bmi" />
                                    <FormGroup label="PBF (%)" name="pbf" />
                                    <FormGroup label="BMR (kcal)" name="bmr" />
                                </div>
                            </div>

                            {/* SECTION 3: CƠ BỘ PHẬN */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h4 className="text-[10px] font-medium text-black/40 dark:text-white/40 tracking-[2px] mb-4">Cơ từng bộ phận (kg)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <FormGroup label="Tay Phải" name="lean_arm_r" />
                                    <FormGroup label="Tay Trái" name="lean_arm_l" />
                                    <FormGroup label="Thân mình" name="lean_trunk" />
                                    <FormGroup label="Chân Phải" name="lean_leg_r" />
                                    <FormGroup label="Chân Trái" name="lean_leg_l" />
                                </div>
                            </div>

                             {/* SECTION 4: MỠ BỘ PHẬN */}
                             <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h4 className="text-[10px] font-medium text-black/40 dark:text-white/40 tracking-[2px] mb-4">Mỡ từng bộ phận (kg)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <FormGroup label="Tay Phải" name="fat_arm_r" />
                                    <FormGroup label="Tay Trái" name="fat_arm_l" />
                                    <FormGroup label="Thân mình" name="fat_trunk" />
                                    <FormGroup label="Chân Phải" name="fat_leg_r" />
                                    <FormGroup label="Chân Trái" name="fat_leg_l" />
                                </div>
                            </div>

                            {/* SECTION 5: KIỂM SOÁT */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h4 className="text-[10px] font-medium text-black/40 dark:text-white/40 tracking-[2px] mb-4">Mục tiêu kiểm soát</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <FormGroup label="Cân nặng mục tiêu" name="target_weight" />
                                    <FormGroup label="Điều chỉnh Mỡ" name="fat_control" />
                                    <FormGroup label="Điều chỉnh Cơ" name="muscle_control" />
                                    <FormGroup label="Điều chỉnh Cân" name="weight_control" />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-white border-t sticky bottom-0">
                            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-12 px-8 font-medium text-black/60 dark:text-white/60">Hủy</Button>
                            <Button type="submit" disabled={loading} className="rounded-xl h-12 px-10 bg-red-600 hover:bg-red-700 text-white font-medium shadow-xl shadow-red-100 dark:shadow-none active:scale-95 transition-all">
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Lưu kết quả
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function FormGroup({ label, name, defaultValue }: any) {
    return (
        <div className="space-y-2">
            <Label className="text-[11px] font-medium text-black/60 dark:text-white/60 tracking-tight">{label}</Label>
            <Input 
                type="number" 
                step="0.01" 
                name={name} 
                defaultValue={defaultValue || ''} 
                className="rounded-xl border-slate-200 bg-white h-11 focus:ring-red-500 text-black font-medium" 
            />
        </div>
    )
}
