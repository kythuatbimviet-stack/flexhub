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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Loader2, MessageSquare, Send, User } from 'lucide-react'
import { toast } from 'sonner'
import { shareContractViaZalo } from '@/app/actions/contracts'
import { fetchZaloUsers } from '@/app/actions/zalo-users'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [zaloUsers, setZaloUsers] = React.useState<any[]>([])
  const [fetchingUsers, setFetchingUsers] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  const filteredUsers = React.useMemo(() => {
    if (!searchTerm) return zaloUsers
    const s = searchTerm.toLowerCase()
    return zaloUsers.filter(u => 
      u.display_name?.toLowerCase().includes(s) || 
      u.zalo_user_id?.toLowerCase().includes(s)
    )
  }, [zaloUsers, searchTerm])

  const selectedUser = React.useMemo(() => 
    zaloUsers.find(u => u.zalo_user_id === zaloId)
  , [zaloUsers, zaloId])

  const loadZaloUsers = React.useCallback(async () => {
    setFetchingUsers(true)
    try {
      const res = await fetchZaloUsers()
      if (res.success) {
        setZaloUsers(res.data || [])
      }
    } catch (error) {
      console.error('Error fetching Zalo users:', error)
    } finally {
      setFetchingUsers(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      loadZaloUsers()
      if (contractData) {
        setZaloId(contractData.zalo_id || contractData.clients?.zalo_id || '')
        setMessage(
          `Eva's Fit gửi chị ${contractData.clients?.member_name || 'Hội viên'} hợp đồng điện tử. Chị vui lòng xem file đính kèm.`
        )
      }
    }
  }, [open, contractData, loadZaloUsers])

  const handleSend = async () => {
    setLoading(true)
    try {
      const res = await shareContractViaZalo(contractId, message, zaloId)
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
            
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  disabled={fetchingUsers}
                  className="w-full h-12 justify-between rounded-xl border-slate-200 bg-white dark:bg-slate-800 font-normal hover:bg-slate-50 transition-all text-slate-900 dark:text-white"
                >
                  {selectedUser ? (
                    <div className="flex items-center gap-2 truncate">
                      <Avatar className="w-6 h-6 rounded-md">
                        <AvatarImage src={selectedUser.avatar_url} />
                        <AvatarFallback className="text-[10px]">{selectedUser.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium">{selectedUser.display_name}</span>
                    </div>
                  ) : fetchingUsers ? "Đang tải..." : "Chọn người dùng Zalo"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[452px] rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden" align="start">
                <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-3 h-11 bg-slate-50/50">
                  <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    placeholder="Tìm kiếm theo tên hoặc ID..."
                    className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[280px]">
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500 italic">
                      Không tìm thấy người dùng
                    </div>
                  ) : (
                    <div className="p-1">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.zalo_user_id}
                          onClick={() => {
                            setZaloId(user.zalo_user_id)
                            setPopoverOpen(false)
                          }}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800/60 group",
                            zaloId === user.zalo_user_id && "bg-blue-50 dark:bg-blue-900/20"
                          )}
                        >
                          <Avatar className="w-8 h-8 rounded-lg border border-slate-100 dark:border-slate-800">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                              {user.display_name?.charAt(0) || <User className="w-3 h-3" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className={cn(
                              "text-sm font-bold text-slate-900 dark:text-white leading-tight",
                              zaloId === user.zalo_user_id && "text-blue-600 dark:text-blue-400"
                            )}>
                              {user.display_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate">ID: {user.zalo_user_id}</span>
                          </div>
                          {zaloId === user.zalo_user_id && (
                            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
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
