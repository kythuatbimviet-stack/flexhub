'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Settings2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchContractById } from '@/app/actions/contracts'
import { fetchActiveTemplateForBranch } from '@/app/actions/contract-templates'
import { getContractHTML, getContractHTMLFromTemplate } from '@/components/contracts/contract-print-template'
import { numberToVietnameseWords } from '@/lib/utils'

export default function ContractPrintPage() {
    const rawId = useParams<{ id: string }>().id
    const id = decodeURIComponent(rawId)
    const router = useRouter()

    const [contract, setContract] = React.useState<any>(null)
    const [templateContent, setTemplateContent] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    // Margin config (cm)
    const [margins, setMargins] = React.useState({ top: 2, bottom: 2, left: 2, right: 2 })

    React.useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const [contractRes, templateRes] = await Promise.all([
                    fetchContractById(id),
                    fetchActiveTemplateForBranch(undefined),
                ])
                if (!contractRes.success || !contractRes.data) {
                    setError(`Không tìm thấy hợp đồng (ID: ${id})${contractRes.error ? ' — ' + contractRes.error : ''}`)
                    return
                }
                const c = contractRes.data
                setContract(c)
                // Fetch template for this contract's branch
                const tRes = await fetchActiveTemplateForBranch(c.branch_id)
                if (tRes.success && tRes.data?.content) {
                    setTemplateContent(tRes.data.content)
                } else {
                    setTemplateContent(null)
                }
            } catch (e: any) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const getHTML = React.useCallback(() => {
        if (!contract) return ''
        const base = (templateContent && templateContent.trim())
            ? getContractHTMLFromTemplate(contract, templateContent)
            : getContractHTML(contract)
        // Inject custom margins into the HTML
        return base.replace(
            '</style>',
            `  @page { margin: ${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm; }\n  </style>`
        )
    }, [contract, templateContent, margins])

    const handlePrint = () => {
        const html = getHTML()
        if (!html) return
        const printWindow = window.open('', '_blank', 'width=1000,height=800')
        if (!printWindow) return
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print()
            }, 400)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <p className="text-sm">Đang tải hợp đồng...</p>
                </div>
            </div>
        )
    }

    if (error || !contract) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 font-medium">{error || 'Lỗi tải dữ liệu'}</p>
                    <Button variant="outline" onClick={() => router.back()} className="mt-4">
                        Quay lại
                    </Button>
                </div>
            </div>
        )
    }

    // Build preview HTML (for iframe)
    const previewHTML = getHTML()

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex">
            {/* ── Document Preview ── */}
            <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
                <div className="w-full max-w-[794px]">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">
                        Xem trước tài liệu
                    </p>
                    {/* A4 shadow container */}
                    <div
                        className="bg-white shadow-2xl rounded-md overflow-hidden"
                        style={{ minHeight: '1123px' }}
                    >
                        <iframe
                            srcDoc={previewHTML}
                            className="w-full border-none"
                            style={{ minHeight: '1123px', height: '100%' }}
                            title="Xem trước hợp đồng"
                        />
                    </div>
                </div>
            </div>

            {/* ── Right Sidebar ── */}
            <div className="w-[260px] shrink-0 bg-white border-l border-gray-200 shadow-xl flex flex-col">
                {/* Sidebar header */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Settings2 className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-sm">Cấu hình trang in</span>
                    </div>
                </div>

                {/* Margin config */}
                <div className="px-5 py-4 space-y-4 flex-1">
                    {/* Contract info */}
                    <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
                        <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Hợp đồng</p>
                        <p className="font-semibold text-gray-800">{contract.member_name}</p>
                        <p className="text-gray-500">{contract.id}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${templateContent ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                            {templateContent ? '● Mẫu tùy chỉnh' : '● Mẫu mặc định'}
                        </div>
                    </div>

                    {/* Margins */}
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Lề trang (cm)</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'top', label: 'Lề trên (CM)' },
                                { key: 'right', label: 'Lề phải (CM)' },
                                { key: 'bottom', label: 'Lề dưới (CM)' },
                                { key: 'left', label: 'Lề trái (CM)' },
                            ].map(({ key, label }) => (
                                <div key={key} className="space-y-1">
                                    <Label className="text-[10px] font-semibold text-gray-400 uppercase">{label}</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        value={margins[key as keyof typeof margins]}
                                        onChange={e => setMargins(m => ({ ...m, [key]: parseFloat(e.target.value) || 0 }))}
                                        className="h-9 rounded-xl text-center font-bold text-sm border-gray-200"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reset margins */}
                    <button
                        onClick={() => setMargins({ top: 2, bottom: 2, left: 2, right: 2 })}
                        className="text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                    >
                        Đặt lại lề mặc định (2cm)
                    </button>
                </div>

                {/* Action buttons */}
                <div className="px-5 pb-6 space-y-2.5 border-t border-gray-100 pt-4">
                    <Button
                        onClick={handlePrint}
                        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-100"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        In phiếu ngay
                    </Button>
                    <button
                        onClick={() => window.close()}
                        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 py-1"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Đóng trang này
                    </button>
                </div>
            </div>
        </div>
    )
}
