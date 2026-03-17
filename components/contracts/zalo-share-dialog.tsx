'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Loader2, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { shareContractViaZalo } from '@/app/actions/contracts'

interface ZaloShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string
  contractData: any
}

export function ZaloShareDialog({
  open,
  onOpenChange,
  contractId,
  contractData,
}: ZaloShareDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [zaloId, setZaloId] = React.useState('')
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    if (open && contractData) {
      setZaloId(contractData.zalo_id || contractData.clients?.zalo_id || '')
      setMessage(
        `Eva's Fit gửi chị ${contractData.clients?.member_name || 'Hội viên'} hợp đồng điện tử. Chị vui lòng xem file đính kèm.`
      )
    }
  }, [open, contractData])

  const handleSend = async () => {
    setLoading(true)
    try {
      const res = await shareContractViaZalo(contractId, message)
      if (res.success) {
        toast.info('Đang yêu cầu gửi qua Zalo...')
        onOpenChange(false)
      } else {
        toast.error(res.error || 'Lỗi khi yêu cầu gửi Zalo')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Gửi Zalo Hợp đồng</DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Xác nhận thông tin Zalo và nội dung tin nhắn để gửi cho khách hàng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="zaloId" className="text-xs font-bold text-slate-500 uppercase">
              Zalo ID / Số điện thoại
            </Label>
            <Input
              id="zaloId"
              placeholder="Nhập Zalo ID hoặc SĐT"
              value={zaloId}
              readOnly
              className="rounded-xl border-slate-200 bg-slate-50 text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-xs font-bold text-slate-500 uppercase">
              Nội dung tin nhắn
            </Label>
            <Textarea
              id="message"
              placeholder="Nhập nội dung gửi cho khách..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="rounded-xl border-slate-200 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-red-500">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                  HD_{contractId}_{contractData?.clients?.member_name || 'KhachHang'}.pdf
               </p>
               <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">Đính kèm tự động</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-11 px-6 font-bold dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading}
            className="rounded-xl h-11 px-8 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Gửi Zalo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
