'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAppConfig, upsertBatchAppConfig } from '@/app/actions/app-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Cloud, Save, Key, Mail, Folder, FileText, Loader2, CheckCircle2, AlertCircle, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function GoogleDriveConfigPage() {
  const queryClient = useQueryClient()
  const [testLoading, setTestLoading] = React.useState(false)
  const [cleanupLoading, setCleanupLoading] = React.useState(false)

  const { data: configResult, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: fetchAppConfig
  })

  const saveMutation = useMutation({
    mutationFn: (entries: { key: string, value: string }[]) => upsertBatchAppConfig(entries),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Đã lưu cấu hình Google Drive')
        queryClient.invalidateQueries({ queryKey: ['app-config'] })
      } else {
        toast.error(result.error || 'Lỗi khi lưu cấu hình')
      }
    }
  })

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const entries = [
      { key: 'gdrive_service_account_email', value: formData.get('email') as string },
      { key: 'gdrive_private_key', value: formData.get('private_key') as string },
      { key: 'gdrive_template_id', value: formData.get('template_id') as string },
      { key: 'gdrive_folder_id', value: formData.get('folder_id') as string },
    ]
    saveMutation.mutate(entries)
  }

  const handleTestConnection = async () => {
    setTestLoading(true)
    try {
      const res = await fetch('/api/generate-contract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true })
      })
      const result = await res.json()
      if (result.success) {
        toast.success(result.message || 'Kết nối Google Drive thành công!')
      } else {
        toast.error(result.error || 'Kết nối thất bại')
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message)
    } finally {
      setTestLoading(false)
    }
  }

  const handleCleanup = async () => {
    if (!confirm('Bạn có chắc chắn muốn dọn dẹp bộ nhớ Service Account? Hành động này sẽ xóa vĩnh viễn các file trong Thùng rác của Service Account.')) return
    
    setCleanupLoading(true)
    try {
      const res = await fetch('/api/generate-contract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCleanup: true })
      })
      const result = await res.json()
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error || 'Dọn dẹp thất bại')
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setCleanupLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  const config = configResult?.data || {}

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Cloud className="w-8 h-8 text-blue-500" />
          Cấu hình Google Drive
        </h1>
        <p className="text-slate-500 font-medium">Cấu hình Service Account để tự động tạo PDF từ Google Docs.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              Thông tin xác thực (Service Account)
            </CardTitle>
            <CardDescription>
              Lấy thông tin từ file JSON key của Google Cloud Service Account.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Service Account Email
              </label>
              <Input 
                name="email" 
                defaultValue={config.gdrive_service_account_email}
                placeholder="evafit@project.iam.gserviceaccount.com"
                className="rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4" /> Private Key (JSON)
              </label>
              <Textarea 
                name="private_key" 
                defaultValue={config.gdrive_private_key}
                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                className="min-h-[150px] font-mono text-[13px] rounded-xl border-slate-200"
                required
              />
              <p className="text-[11px] text-slate-400">Dán toàn bộ nội dung trường "private_key" từ file JSON.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-500" />
              Tài nguyên Google Drive
            </CardTitle>
            <CardDescription>
              ID của file mẫu Google Doc và thư mục lưu trữ PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Google Doc Template ID
                </label>
                <Input 
                  name="template_id" 
                  defaultValue={config.gdrive_template_id}
                  placeholder="ID từ URL file Google Doc"
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Folder className="w-4 h-4" /> Drive Folder ID (Export)
                </label>
                <Input 
                  name="folder_id" 
                  defaultValue={config.gdrive_folder_id}
                  placeholder="ID từ URL thư mục Google Drive"
                  className="rounded-xl border-slate-200"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-[13px] text-blue-700 dark:text-blue-300 leading-relaxed">
                <p className="font-bold mb-1">📢 Quan trọng:</p>
                <p>Hãy đảm bảo bạn đã <strong>chia sẻ quyền (Share)</strong> file Mẫu và Thư mục Export cho email Service Account ở trên với quyền <strong>Editor</strong>.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testLoading}
              className="rounded-xl px-6 h-11 font-bold border-slate-200 hover:bg-slate-50"
            >
              {testLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
              Kiểm tra kết nối
            </Button>

            <Button
                type="button"
                variant="ghost"
                onClick={handleCleanup}
                disabled={cleanupLoading}
                className="rounded-xl px-6 h-11 font-medium text-slate-500 hover:text-red-600 hover:bg-red-50"
                title="Xóa vĩnh viễn các file tạm và dọn thùng rác của Service Account"
            >
                {cleanupLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Dọn dẹp bộ nhớ
            </Button>
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-xl px-10 h-11 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 dark:shadow-none"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Lưu cấu hình
          </Button>
        </div>
      </form>
    </div>
  )
}
