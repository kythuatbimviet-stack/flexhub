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
import { FileText, Loader2, Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import { sendCustomContractEmail } from '@/app/actions/contracts'

interface EmailShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string
  contractData: any
}

export function EmailShareDialog({
  open,
  onOpenChange,
  contractId,
  contractData,
}: EmailShareDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [subject, setSubject] = React.useState('')
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    if (open && contractData) {
      setEmail(contractData.clients?.email || '')
      setSubject(`Hợp đồng ${contractData.clients?.member_name || ''} - Eva's Fit Nam Định`)
      setMessage(
        `Trung tâm Eva's Fit Nam Định xin chào chị ${contractData.clients?.member_name || 'Hội viên'},\n\n` +
        `Cảm ơn chị đã tin tưởng và lựa chọn Eva's Fit.\n\n` +
        `Đây là biên nhận và hợp đồng của chị tại Eva's Fit. Mọi thông tin chi tiết chị vui lòng kiểm tra trong file PDF đính kèm.\n\n` +
        `Nếu cần hỗ trợ thêm, chị có thể phản hồi lại email này.\n\n` +
        `Trân trọng,\nĐội ngũ Eva's Fit Nam Định`
      )
    }
  }, [open, contractData])

  const handleSend = async () => {
    if (!email) {
      toast.error('Vui lòng nhập email người nhận')
      return
    }

    setLoading(true)
    try {
      const res = await sendCustomContractEmail(contractId, email, subject, message)
      if (res.success) {
        if (res.method === 'mailto' && res.mailtoUrl) {
            window.location.href = res.mailtoUrl
            toast.success('Hệ thống đang mở ứng dụng email của bạn...')
        } else {
            toast.success('Đã gửi email thành công!')
        }
        onOpenChange(false)
      } else {
        toast.error(res.error || 'Lỗi khi gửi email')
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
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-2">
            <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Gửi Email Hợp đồng</DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Điền thông tin email và nội dung tin nhắn để gửi cho khách hàng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase">
              Email người nhận
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-slate-200 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-xs font-bold text-slate-500 uppercase">
              Tiêu đề
            </Label>
            <Input
              id="subject"
              placeholder="Tiêu đề email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl border-slate-200 focus:ring-emerald-500"
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
              rows={6}
              className="rounded-xl border-slate-200 focus:ring-emerald-500 resize-none"
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
            className="rounded-xl h-11 px-8 font-bold bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white shadow-xl"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Gửi ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
