'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchInBodyRecordById } from '@/app/actions/inbody-records'
import { InBodyReportView } from '@/components/clients/inbody-report-view'
import { Loader2, Printer, X, Download, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toJpeg } from 'html-to-image'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

export default function InBodyPrintPage() {
    const params = useParams()
    const id = params.id as string
    const [isExporting, setIsExporting] = useState(false)

    const { data: record, isLoading, error } = useQuery({
        queryKey: ['inbody-record', id],
        queryFn: async () => {
            const res = await fetchInBodyRecordById(id)
            if (!res.success) throw new Error(res.error)
            return res.data
        },
        enabled: !!id
    })

    React.useEffect(() => {
        if (record) {
            document.title = `InBody_Report_${record.clients?.member_name || 'Client'}`
        }
    }, [record])

    const handleDirectPDFExport = async () => {
        if (!record) return
        
        setIsExporting(true)
        const toastId = toast.loading('Đang khởi tạo bản PDF chất lượng cao...')
        
        try {
            // Target the inner report table (avoids the mx-auto outer wrapper margins)
            const element = document.getElementById('inbody-report-pdf-area')
            if (!element) throw new Error('Không tìm thấy vùng dữ liệu báo cáo')

            // Temporarily remove max-width constraint so it fills full width for capture
            const originalStyle = element.getAttribute('style') || ''
            element.style.maxWidth = 'none'
            element.style.margin = '0'
            element.style.borderRadius = '0'
            element.style.boxShadow = 'none'

            // Use html-to-image (SVG foreignObject) — fully supports oklch() from Tailwind v4
            const imgData = await toJpeg(element, {
                quality: 0.98,
                pixelRatio: 3,
                backgroundColor: '#ffffff',
            })

            // Restore original styles
            element.setAttribute('style', originalStyle)

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()   // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight() // 297mm

            // Load image to get actual pixel dimensions
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const i = new Image()
                i.onload = () => resolve(i)
                i.onerror = reject
                i.src = imgData
            })

            // naturalWidth/naturalHeight already include pixelRatio — no need to divide
            const ratio = pdfWidth / img.naturalWidth
            const imgHeightInPdf = img.naturalHeight * ratio

            let heightLeft = imgHeightInPdf
            let yOffset = 0

            // First page
            pdf.addImage(imgData, 'JPEG', 0, yOffset, pdfWidth, imgHeightInPdf, undefined, 'FAST')
            heightLeft -= pdfHeight

            // Add subsequent pages if content overflows A4
            while (heightLeft > 0) {
                yOffset -= pdfHeight
                pdf.addPage()
                pdf.addImage(imgData, 'JPEG', 0, yOffset, pdfWidth, imgHeightInPdf, undefined, 'FAST')
                heightLeft -= pdfHeight
            }

            const fileName = `InBody_${record.clients?.member_name || 'Report'}_${format(new Date(), 'ddMMyy')}.pdf`
            pdf.save(fileName)

            toast.success('Đã xuất bản PDF thành công!', { id: toastId })
        } catch (err: any) {
            console.error('PDF Export Error:', err)
            toast.error(`Lỗi xuất PDF: ${err.message}`, { id: toastId })
        } finally {
            setIsExporting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                <p className="text-slate-500 font-medium animate-pulse uppercase tracking-widest text-[11px]">Đang tải báo cáo...</p>
            </div>
        )
    }

    if (error || !record) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center text-black">
                <Printer className="w-12 h-12 mb-4 opacity-20" />
                <h1 className="text-xl font-bold mb-2">Không tìm thấy dữ liệu</h1>
                <Button onClick={() => window.close()} variant="link" className="text-blue-600">Đóng Tab</Button>
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen font-inter overflow-x-hidden">
            {/* Elegant Fixed Print Header - Hidden when printing */}
            <div className="fixed top-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-10 no-print shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                        <FileCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-black uppercase tracking-tighter text-base">Trung tâm Phân tích InBody</div>
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Hệ thống xuất bản báo cáo chuyên sâu</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => window.close()}
                        className="rounded-full h-12 w-12 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </Button>
                    
                    <Button 
                        onClick={handleDirectPDFExport}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8 font-bold shadow-xl transition-all active:scale-95 text-[11px] uppercase tracking-widest gap-2"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        XUẤT FILE PDF TRỰC TIẾP
                    </Button>

                    <Button 
                        onClick={() => window.print()}
                        className="bg-black hover:bg-slate-800 text-white rounded-xl h-12 px-8 font-bold shadow-xl transition-all active:scale-95 text-[11px] uppercase tracking-widest gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        IN NHANH (A4)
                    </Button>
                </div>
            </div>

            {/* The Report Content */}
            <div className="pt-28 pb-20 print:pt-0 print:pb-0">
                <div className="print-content-wrapper">
                    <InBodyReportView 
                        data={record} 
                        client={record.clients} 
                        isPrintMode={true}
                    />
                </div>
            </div>

            <style jsx global>{`
                /* Print specific overrides */
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm 0; /* Minimal margin just for safety */
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-content-wrapper {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    /* Force table layout for repeating headers */
                    table { 
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                    }
                    thead { display: table-header-group !important; }
                    tfoot { display: table-footer-group !important; }
                }
            `}</style>
        </div>
    )
}

function format(date: Date, str: string) {
    const d = date.getDate().toString().padStart(2, '0')
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const y = date.getFullYear().toString().slice(-2)
    return str.replace('dd', d).replace('MM', m).replace('yy', y)
}
