'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileText, RefreshCw, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchContractById } from '@/app/actions/contracts'
import { fetchAllPlaceholders } from '@/app/actions/contract-placeholders'
import { getContractHTMLV2 } from '@/components/contracts/contract-print-template'
import { toast } from 'sonner'

export default function ContractPrintV2Page() {
  const rawId = useParams<{ id: string }>().id
  const id = decodeURIComponent(rawId)
  const router = useRouter()

  const [contract, setContract] = React.useState<any>(null)
  const [templateContent, setTemplateContent] = React.useState<string | null>(null)
  const [placeholders, setPlaceholders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [exportingPdf, setExportingPdf] = React.useState(false)

  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [contractRes, placeholderRes, templateRes] = await Promise.all([
          fetchContractById(id),
          fetchAllPlaceholders(),
          // V2 LUÔN dùng contracts.html chuẩn từ API (không dùng DB template)
          fetch('/api/contract-template-v2').then(r => {
            if (!r.ok) throw new Error('Không load được template V2')
            return r.text()
          }),
        ])

        if (!contractRes.success || !contractRes.data) {
          setError(`Không tìm thấy hợp đồng (ID: ${id})`)
          return
        }
        setContract(contractRes.data)
        if (placeholderRes.success) setPlaceholders(placeholderRes.data || [])
        setTemplateContent(templateRes)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const getHtml = React.useCallback(() => {
    if (!contract || !templateContent) return ''
    return getContractHTMLV2(contract, templateContent, placeholders)
  }, [contract, templateContent, placeholders])

  const previewHtml = React.useMemo(() => getHtml(), [getHtml])

  const handlePrint = () => {
    const html = getHtml()
    if (!html) return
    const w = window.open('', '_blank', 'width=1000,height=800')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.onload = () => setTimeout(() => w.print(), 600)
  }

  const handleExportPDF = async () => {
    setExportingPdf(true)
    try {
      const pdfHtml = getHtml()
      if (!pdfHtml) { toast.error('Không thể tạo HTML'); return }

      // Render trong iframe ẩn với width A4 chuẩn (794px = 210mm @ 96dpi)
      const tempIframe = document.createElement('iframe')
      tempIframe.style.cssText = [
        'position:fixed',
        'top:-9999px',
        'left:-9999px',
        'width:794px',
        'border:none',
        'visibility:hidden',
      ].join(';')
      document.body.appendChild(tempIframe)
      tempIframe.contentDocument!.write(pdfHtml)
      tempIframe.contentDocument!.close()

      // Chờ fonts + ảnh load
      await new Promise<void>(resolve => {
        const check = () => {
          if (tempIframe.contentDocument?.readyState === 'complete') resolve()
          else setTimeout(check, 100)
        }
        setTimeout(check, 800)
      })

      // Đặt height bằng scroll height thực tế để capture đủ nội dung
      const scrollH = tempIframe.contentDocument!.body.scrollHeight
      tempIframe.style.height = `${scrollH}px`
      await new Promise(r => setTimeout(r, 300))

      const targetEl = tempIframe.contentDocument!.body as HTMLElement

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'), import('jspdf'),
      ])

      const canvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
        height: scrollH,
        windowHeight: scrollH,
      })
      document.body.removeChild(tempIframe)

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height / canvas.width) * pw

      let y = 0
      while (y < imgH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -y, pw, imgH)
        y += ph
      }
      const fname = `hop-dong-${(contract?.member_name || 'export').replace(/[^a-zA-ZÀ-ỹ0-9]/g, '-')}.pdf`
      pdf.save(fname)
      toast.success(`Đã xuất: ${fname}`)
    } catch (e: any) {
      toast.error('Lỗi xuất PDF: ' + e.message)
    } finally {
      setExportingPdf(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <p className="text-sm">Đang tải hợp đồng...</p>
      </div>
    </div>
  )

  if (error || !contract) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center space-y-3 max-w-md px-4">
        <p className="text-red-500 font-medium">{error || 'Lỗi tải dữ liệu'}</p>
        <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex">
      {/* Preview */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">
          Xem trước — Mẫu hợp đồng chuẩn V2
        </p>
        <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] font-bold text-emerald-700">Mẫu chuẩn — Header + Footer tự động</span>
        </div>
        <div className="w-full max-w-[794px]">
          <div className="bg-white shadow-2xl rounded-md overflow-hidden" style={{ minHeight: '1123px' }}>
            {previewHtml ? (
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="w-full border-none"
                style={{ minHeight: '1400px', height: '100%' }}
                title="Xem trước hợp đồng V2"
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Đang tải template...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-[240px] shrink-0 bg-white border-l border-gray-200 shadow-xl flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-sm text-gray-800">Xuất HĐ Chuẩn</span>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs mt-2">
            <p className="font-semibold text-gray-800 truncate">{contract.member_name}</p>
            <p className="text-gray-400 truncate text-[10px]">{contract.id}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
              ● Mẫu chuẩn V2
            </span>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2 border-b border-gray-100">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Layout cố định theo chuẩn ảnh mẫu: header logo, bảng màu đỏ, chữ ký, footer hotline.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-rose-500 font-semibold">
            <span>Hotline: 0832 646 686</span>
          </div>
        </div>

        <div className="px-4 pb-5 pt-4 space-y-2 mt-auto border-t border-gray-100">
          <Button
            onClick={handlePrint}
            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
          >
            <Printer className="w-4 h-4 mr-2" /> In phiếu
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={exportingPdf || !previewHtml}
            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md disabled:opacity-60"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportingPdf ? 'Đang xuất...' : 'Xuất PDF'}
          </Button>
          <button
            onClick={() => window.close()}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 py-1 mt-1"
          >
            <ArrowLeft className="w-3 h-3" /> Đóng trang này
          </button>
        </div>
      </div>
    </div>
  )
}
