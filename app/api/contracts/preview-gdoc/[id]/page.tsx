'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Cloud, FileText, Loader2, Printer, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchContractById, updateContract } from '@/app/actions/contracts'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export default function GDocPreviewPage() {
  const rawId = useParams<{ id: string }>().id
  const id = decodeURIComponent(rawId)
  const router = useRouter()

  const [contract, setContract] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    try {
      const res = await fetchContractById(id)
      if (res.success && res.data) {
        setContract(res.data)
        if (res.data.contract_file_url === 'create_contract') {
          setGenerating(true)
        } else {
          setGenerating(false)
        }
      } else {
        setError(res.error || 'Không tìm thấy hợp đồng')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime listener
  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`preview-gdoc-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${id}`
        },
        (payload) => {
          const newUrl = payload.new.contract_file_url
          if (newUrl && newUrl !== 'create_contract') {
            setContract((prev: any) => ({ ...prev, contract_file_url: newUrl }))
            setGenerating(false)
            toast.success('Hợp đồng PDF đã sẵn sàng!')
          } else if (newUrl === 'create_contract') {
            setGenerating(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const handleRegenerate = async () => {
    if (!contract) return
    setGenerating(true)
    try {
      const res = await updateContract(id, { contract_file_url: 'create_contract' })
      if (!res.success) {
        setGenerating(false)
        toast.error(res.error || 'Lỗi khi yêu cầu tạo lại PDF')
      } else {
        toast.info('Đang yêu cầu tạo lại PDF...')
      }
    } catch (e: any) {
      setGenerating(false)
      toast.error(e.message)
    }
  }

  const handlePrint = () => {
    if (contract?.contract_file_url) {
      window.open(contract.contract_file_url, '_blank')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        <p className="font-medium animate-pulse">Đang tải thông tin hợp đồng...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 border border-slate-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <RefreshCw className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Đã xảy ra lỗi</h2>
        <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="rounded-xl px-8 h-11 font-bold border-slate-200"
        >
          Quay lại
        </Button>
      </div>
    </div>
  )

  const hasPdf = contract?.contract_file_url && contract.contract_file_url !== 'create_contract'

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.close()}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div className="h-8 w-[1px] bg-slate-200 mx-1" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-500" />
              Xem trước Hợp đồng (Google Docs)
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">#{id} — {contract?.member_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={generating}
            className="rounded-xl h-10 px-4 text-xs font-bold border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${generating ? 'animate-spin' : ''}`} />
            Tạo lại PDF
          </Button>

          <Button
            onClick={handlePrint}
            disabled={!hasPdf || generating}
            className="rounded-xl h-10 px-6 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
          >
            <Printer className="w-3.5 h-3.5 mr-2" />
            Mở file PDF
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex bg-slate-50">
        {/* Left Info Panel */}
        <aside className="w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto hidden lg:block">
           <div className="space-y-6">
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Thông tin xử lý</h3>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Trạng thái:</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        generating ? 'bg-amber-50 text-amber-600 animate-pulse' : 
                        hasPdf ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {generating ? '● Đang tạo PDF...' : hasPdf ? '● Đã sẵn sàng' : '○ Chờ kích hoạt'}
                      </span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Tài khoản Google:</span>
                      <span className="text-xs font-bold text-slate-700">Cá nhân (GAS)</span>
                   </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Hướng dẫn</h3>
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-[12px] text-blue-700 leading-relaxed space-y-2">
                  <p>Hợp đồng được tạo tự động bằng Google Doc Template. Sau khi tạo xong, bạn có thể xem trực tiếp ở bên phải.</p>
                  <p>Nếu dữ liệu bị cũ, hãy bấm <strong>&quot;Tạo lại PDF&quot;</strong> để hệ thống cập nhật mới.</p>
                </div>
              </div>

              {hasPdf && (
                <div className="pt-2">
                   <a 
                    href={contract.contract_file_url} 
                    target="_blank" 
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                   >
                     <ExternalLink className="w-3 h-3" /> Mở trong tab mới
                   </a>
                </div>
              )}
           </div>
        </aside>

        {/* Preview Area */}
        <div className="flex-1 relative flex flex-col items-center overflow-auto p-4 md:p-8">
           <div className="w-full max-w-[850px] flex-1 flex flex-col">
              {generating ? (
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center p-10">
                   <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                      <div className="absolute inset-0 border-4 border-t-red-500 rounded-full animate-spin" />
                      <FileText className="absolute inset-0 m-auto w-8 h-8 text-slate-300" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-800 mb-2">Đang khởi tạo Hợp đồng PDF</h3>
                   <p className="text-slate-500 max-w-xs text-sm leading-relaxed">
                     Hệ thống Google Apps Script đang xử lý mẫu. Vui lòng không đóng cửa sổ này, kết quả sẽ tự động hiển thị.
                   </p>
                </div>
              ) : hasPdf ? (
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden min-h-[500px]">
                   <iframe 
                    src={contract.contract_file_url} 
                    className="w-full h-full border-none"
                    style={{ minHeight: 'calc(100vh - 160px)' }}
                    title="Google Doc PDF Preview"
                   />
                </div>
              ) : (
                <div className="flex-1 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-10">
                   <Cloud className="w-16 h-16 text-slate-200 mb-4" />
                   <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa kích hoạt tạo PDF</h3>
                   <p className="text-slate-500 max-w-xs text-xs mb-6">
                     Bấm nút bên dưới để yêu cầu Google Apps Script tạo file PDF.
                   </p>
                   <Button onClick={handleRegenerate} className="rounded-xl px-10 h-11 bg-red-600 hover:bg-red-700">
                      Bắt đầu tạo PDF
                   </Button>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  )
}
