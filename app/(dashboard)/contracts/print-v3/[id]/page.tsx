'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileText, RefreshCw, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchContractById } from '@/app/actions/contracts'
import { fetchAllPlaceholders } from '@/app/actions/contract-placeholders'
import { getContractHTMLV3 } from '@/components/contracts/contract-print-template'
import { toast } from 'sonner'

export default function ContractPrintV3Page() {
  const rawId = useParams<{ id: string }>().id
  const id = decodeURIComponent(rawId)
  const router = useRouter()

  const [contract, setContract] = React.useState<any>(null)
  const [templateContent, setTemplateContent] = React.useState<string | null>(null)
  const [placeholders, setPlaceholders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [printing, setPrinting] = React.useState(false)

  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [contractRes, placeholderRes, templateRes] = await Promise.all([
          fetchContractById(id),
          fetchAllPlaceholders(),
          // V3 dùng hop_dong_template.html từ API
          fetch('/api/contract-template-v3').then(r => {
            if (!r.ok) throw new Error('Không load được template V3')
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
    const html = getContractHTMLV3(contract, templateContent, placeholders)
    return html || ''
  }, [contract, templateContent, placeholders])

  const previewHtml = React.useMemo(() => getHtml(), [getHtml])

  // Nếu đã tải xong mà không có preview HTML, có thể là lỗi template
  React.useEffect(() => {
    if (!loading && !previewHtml && !error) {
      setError('Không thể tạo nội dung xem trước. Vui lòng kiểm tra lại file template.')
    }
  }, [loading, previewHtml, error])

  /**
   * Mở cửa sổ in mới với HTML đầy đủ.
   * CSS @page + position:fixed footer đã được inject bởi getContractHTMLV3,
   * nên browser sẽ tự ngắt trang đúng + hiện header/footer mỗi trang khi in.
   * Người dùng chọn "Save as PDF" trong dialog in để xuất file PDF vector chất lượng cao.
   */
  const handlePrintPDF = async () => {
    const html = getHtml()
    if (!html) {
      toast.error('Không thể tạo HTML hợp đồng')
      return
    }

    setPrinting(true)
    try {
      const w = window.open('', '_blank', 'width=900,height=900')
      if (!w) {
        toast.error('Trình duyệt đã chặn cửa sổ popup. Vui lòng cho phép popup cho trang này.')
        return
      }

      w.document.open()
      w.document.write(html)
      w.document.close()

      // Chờ fonts và ảnh tải xong trước khi gọi print()
      w.onload = () => {
        // Dùng document.fonts.ready để đảm bảo Google Fonts đã tải
        ;(w.document as any).fonts?.ready
          ? (w.document as any).fonts.ready.then(() => {
              setTimeout(() => {
                w.focus()
                w.print()
                setPrinting(false)
              }, 400)
            })
          : setTimeout(() => {
              w.focus()
              w.print()
              setPrinting(false)
            }, 1000)
      }
    } catch (e: any) {
      toast.error('Lỗi in: ' + e.message)
      setPrinting(false)
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
          Xem trước — Mẫu hợp đồng chuẩn V3
        </p>
        <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] font-bold text-emerald-700">Mẫu chuẩn — Template riêng</span>
        </div>
        <div className="w-full max-w-[794px]">
          <div className="bg-white shadow-2xl rounded-md overflow-hidden" style={{ minHeight: '1123px' }}>
            {previewHtml ? (
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="w-full border-none"
                style={{ minHeight: '5500px', height: '100%' }}
                title="Xem trước hợp đồng V3"
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
              ● Mẫu chuẩn V3
            </span>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2 border-b border-gray-100">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Template đầy đủ: header logo, bảng dữ liệu và footer số trang mỗi trang.
          </p>
        </div>

        <div className="px-4 pb-5 pt-4 space-y-3 mt-auto border-t border-gray-100">
          {/* Nút chính: Mở dialog in của browser */}
          <Button
            onClick={handlePrintPDF}
            disabled={printing || !previewHtml}
            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md disabled:opacity-60"
          >
            <Printer className="w-4 h-4 mr-2" />
            {printing ? 'Đang mở...' : 'In / Xuất PDF'}
          </Button>

          {/* Hướng dẫn */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <p className="text-[10px] text-blue-700 leading-relaxed">
              💡 Trong hộp thoại in, chọn{' '}
              <strong>&quot;Save as PDF&quot;</strong> để xuất file PDF chất lượng cao với header & footer đúng mẫu.
            </p>
          </div>

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
