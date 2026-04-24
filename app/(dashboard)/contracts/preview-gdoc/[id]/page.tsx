'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Cloud, FileText, Loader2, Printer, RefreshCw, ExternalLink, Download, MessageSquare, Mail, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchContractById, updateContract, shareContractViaZalo, shareContractViaEmail } from '@/app/actions/contracts'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { EmailShareDialog } from '@/components/contracts/email-share-dialog'
import { ZaloShareDialog } from '@/components/contracts/zalo-share-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function GDocPreviewPage() {
  const rawId = useParams<{ id: string }>().id
  const id = decodeURIComponent(rawId)
  const router = useRouter()

  const [contract, setContract] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [sharingZalo, setSharingZalo] = React.useState(false)
  const [sharingEmail, setSharingEmail] = React.useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false)
  const [zaloDialogOpen, setZaloDialogOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [autoSendEmail, setAutoSendEmail] = React.useState(false)
  const [finalizing, setFinalizing] = React.useState(false)

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

  // Polling fallback (if Realtime fails)
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (generating) {
      interval = setInterval(async () => {
        try {
          const res = await fetchContractById(id)
          if (res.success && res.data) {
            const currentUrl = res.data.contract_file_url
            if (currentUrl && currentUrl !== 'create_contract') {
              setContract(res.data)
              setGenerating(false)
              if (interval) clearInterval(interval)
            }
          }
        } catch (e) {
          console.error("Polling error:", e)
        }
      }, 3000) // Poll every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [id, generating])

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
          console.log("Realtime update received:", payload)
          const newUrl = payload.new.contract_file_url
          if (newUrl && newUrl !== 'create_contract') {
            setContract((prev: any) => ({ ...prev, contract_file_url: newUrl }))
            setGenerating(false)
            toast.success('Hợp đồng PDF đã sẵn sàng!')
          } else if (newUrl === 'create_contract') {
            setGenerating(true)
          }

          // Check for sharing status "done"
          if (payload.new.sendzalo === 'done' && payload.old.sendzalo !== 'done') {
            toast.success('Đã gửi hợp đồng qua Zalo thành công!')
            setSharingZalo(false)
          }
          if (payload.new.sendemail === 'done' && payload.old.sendemail !== 'done') {
            toast.success('Đã gửi hợp đồng qua Email thành công!')
            setSharingEmail(false)
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status)
      })

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

  const handleShareZalo = async () => {
    if (!contract) return
    setZaloDialogOpen(true)
  }

  const handleShareEmail = async () => {
    if (!contract) return
    setEmailDialogOpen(true)
  }

  const handleFinalizeReview = async () => {
    if (!contract) return
    if (!confirm('Xác nhận hoàn tất Review hợp đồng này?')) return

    setFinalizing(true)
    try {
      const updates: any = { status: 'Đã Review' }
      
      // Nếu tick chọn tự động gửi email
      if (autoSendEmail) {
        updates.sendemail = 'trigger_email'
      }

      const res = await updateContract(id, updates)
      if (res.success) {
        toast.success(autoSendEmail ? 'Đã Review và đang yêu cầu gửi email khách hàng!' : 'Đã xác nhận Review thành công!')
        setContract((prev: any) => ({ ...prev, ...updates }))
        // Refresh data to be sure
        loadData()
      } else {
        toast.error(res.error || 'Lỗi khi xác nhận Review')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setFinalizing(false)
    }
  }

  const getEmbedUrl = (url?: string) => {
    if (!url) return ''
    if (url.includes('drive.google.com/file/d/')) {
       // Convert view link to preview link for embedding
       return url.replace(/\/view(\?.*)?$/, '/preview')
    }
    return url
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        <p className="font-medium animate-pulse">Đang tải thông tin hợp đồng...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 border border-slate-100 dark:border-slate-800">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto">
          <RefreshCw className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Đã xảy ra lỗi</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="rounded-xl px-8 h-11 font-bold border-slate-200 dark:border-slate-800"
        >
          Quay lại
        </Button>
      </div>
    </div>
  )

  const hasPdf = contract?.contract_file_url && contract.contract_file_url !== 'create_contract'
  const embedUrl = getEmbedUrl(contract?.contract_file_url)

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 flex flex-col transition-colors duration-300">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.close()}
            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-500" />
              Xem trước Hợp đồng (Google Docs)
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">#{id} — {contract?.member_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contract?.status === 'Chờ Review' && (
            <div className="flex items-center gap-4 mr-4 px-4 py-1.5 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="autoSendEmail" 
                  checked={autoSendEmail}
                  onCheckedChange={(checked) => setAutoSendEmail(checked === true)}
                  className="border-orange-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                />
                <Label 
                  htmlFor="autoSendEmail"
                  className="text-[11px] font-bold text-orange-700 dark:text-orange-400 cursor-pointer select-none"
                >
                  Tự gửi email khách hàng sau khi review
                </Label>
              </div>
              <div className="w-px h-6 bg-orange-200 dark:bg-orange-800" />
              <Button
                onClick={handleFinalizeReview}
                disabled={finalizing || generating}
                className="rounded-xl h-9 px-6 text-[12px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 dark:shadow-none transition-all active:scale-95"
              >
                {finalizing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5 mr-2" />}
                Chốt Review
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={generating}
            className="rounded-xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${generating ? 'animate-spin' : ''}`} />
            Tạo lại PDF
          </Button>

          <Button
            variant="outline"
            onClick={handleShareZalo}
            disabled={!hasPdf || generating || sharingZalo}
            className="rounded-xl h-10 px-4 text-xs font-bold border-blue-100 text-blue-600 hover:bg-blue-50"
          >
            {sharingZalo ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5 mr-2" />}
            Gửi Zalo
          </Button>

          <Button
            variant="outline"
            onClick={handleShareEmail}
            disabled={!hasPdf || generating || sharingEmail}
            className="rounded-xl h-10 px-4 text-xs font-bold border-emerald-100 text-emerald-600 hover:bg-emerald-50"
          >
            {sharingEmail ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Mail className="w-3.5 h-3.5 mr-2" />}
            Gửi Email
          </Button>

          <Button
            asChild
            disabled={!hasPdf || generating}
            className="rounded-xl h-10 px-6 text-xs font-bold bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-white shadow-lg shadow-slate-200 dark:shadow-none"
          >
            {hasPdf ? (
              <a href={contract.contract_file_url} target="_blank">
                <Download className="w-3.5 h-3.5 mr-2" />
                Tải xuống / Mở PDF
              </a>
            ) : (
              <span>
                <Download className="w-3.5 h-3.5 mr-2" />
                Tải xuống / Mở PDF
              </span>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex bg-slate-50 dark:bg-gray-950">
        {/* Left Info Panel */}
        <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 overflow-y-auto hidden lg:block">
           <div className="space-y-6">
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Thông tin xử lý</h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Trạng thái:</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        generating ? 'bg-amber-50 text-amber-600 animate-pulse dark:bg-amber-950/30' : 
                        hasPdf ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                      }`}>
                        {generating ? '● Đang tạo PDF...' : hasPdf ? '● Đã sẵn sàng' : '○ Chờ kích hoạt'}
                      </span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Nguồn:</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Google Drive</span>
                   </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Hướng dẫn</h3>
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-[12px] text-blue-700 dark:text-blue-400 leading-relaxed space-y-2">
                  <p>Hợp đồng được tạo tự động từ mẫu Google Doc. Khi webhook hoàn tất, file PDF sẽ hiển thị thay thế vòng xoay bên phải.</p>
                  <p>Nếu quá 1 phút chưa thấy kết quả, vui lòng bấm <strong>"Tạo lại PDF"</strong>.</p>
                </div>
              </div>

              {hasPdf && (
                <div className="pt-2 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/20">
                   <h3 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Link hợp đồng:</h3>
                   <a 
                    href={contract.contract_file_url} 
                    target="_blank" 
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold break-all"
                   >
                     <ExternalLink className="w-3 h-3 shrink-0" />
                     {contract.contract_file_url}
                   </a>
                </div>
              )}
           </div>
        </aside>

        {/* Preview Area */}
        <div className="flex-1 relative flex flex-col items-center overflow-auto p-4 md:p-8 bg-slate-50 dark:bg-gray-950">
           <div className="w-full max-w-[850px] flex-1 flex flex-col">
              {generating ? (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center p-10">
                   <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full" />
                      <div className="absolute inset-0 border-4 border-t-red-500 rounded-full animate-spin" />
                      <FileText className="absolute inset-0 m-auto w-8 h-8 text-slate-300 dark:text-slate-600" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Đang xử lý xuất PDF</h3>
                   <p className="text-slate-500 dark:text-slate-400 max-w-xs text-sm leading-relaxed">
                     Vui lòng đợi trong giây lát. Hệ thống đang điền dữ liệu vào mẫu và chuyển đổi sang PDF.
                   </p>
                </div>
              ) : hasPdf ? (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[500px]">
                   <iframe 
                    src={embedUrl} 
                    className="w-full h-full border-none"
                    style={{ minHeight: 'calc(100vh - 160px)' }}
                    title="Google Doc PDF Preview"
                   />
                </div>
              ) : (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center p-10">
                   <Cloud className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
                   <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Chưa có yêu cầu tạo PDF</h3>
                   <p className="text-slate-500 dark:text-slate-500 max-w-xs text-xs mb-6">
                     Bấm nút bên dưới để bắt đầu quá trình tạo file PDF từ Google Doc.
                   </p>
                   <Button onClick={handleRegenerate} className="rounded-xl px-10 h-11 bg-red-600 hover:bg-red-700">
                      Bắt đầu tạo PDF
                   </Button>
                </div>
              )}
           </div>
        </div>
      </main>

      <EmailShareDialog 
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        contractId={id}
        contractData={contract}
      />
      <ZaloShareDialog 
        open={zaloDialogOpen}
        onOpenChange={setZaloDialogOpen}
        contractId={id}
        contractData={contract}
      />
    </div>
  )
}
