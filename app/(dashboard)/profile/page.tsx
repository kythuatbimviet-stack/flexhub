'use client'

import * as React from 'react'
import { User, Mail, Link as LinkIcon, Save, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function ProfilePage() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: user, isLoading } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        }
    })

    const [fullName, setFullName] = React.useState('')
    const [avatarUrl, setAvatarUrl] = React.useState('')

    React.useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '')
            setAvatarUrl(user.user_metadata?.avatar_url || '')
        }
    }, [user])

    const updateProfile = useMutation({
        mutationFn: async () => {
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName, avatar_url: avatarUrl }
            })
            if (authError) throw authError

            const { error: dbError } = await supabase
                .from('users')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id)

            if (dbError) throw dbError
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] })
            toast.success('Cập nhật hồ sơ thành công')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Đã xảy ra lỗi khi cập nhật')
        }
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            </div>
        )
    }

    const initials = fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'NV'

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/50">
                    <User className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Hồ sơ cá nhân</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý thông tin và tài khoản của bạn</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <Card className="border-none shadow-sm dark:shadow-none rounded-[32px] overflow-hidden bg-white dark:bg-gray-900 transition-all duration-300">
                    {/* Banner Decor */}
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400 relative" />

                    <div className="px-8 pb-8">
                        {/* Profile Identity */}
                        <div className="relative -mt-16 flex items-end gap-6 mb-10">
                            <div className="w-32 h-32 rounded-[28px] bg-red-500 border-4 border-white dark:border-gray-900 flex items-center justify-center text-white text-4xl font-bold shadow-xl overflow-hidden ring-4 ring-blue-500/5 transition-transform hover:scale-105 duration-300">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div className="pb-2">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {fullName || 'Chưa cập nhật tên'}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                        Thông tin cơ bản
                                    </h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">
                                            Họ và tên
                                        </label>
                                        <div className="relative group">
                                            <Input
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Nhập họ và tên..."
                                                className="h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all pl-4"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">
                                            Địa chỉ Email
                                        </label>
                                        <div className="relative">
                                            <Input
                                                value={user?.email}
                                                disabled
                                                className="h-12 bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-600 cursor-not-allowed pl-4"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-600 ml-1 italic">
                                            Email dùng để nhận các thông báo hệ thống quan trọng.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Avatar Info */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                        Hình đại diện
                                    </h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">
                                            Đường dẫn ảnh (URL)
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <LinkIcon className="w-4 h-4" />
                                            </div>
                                            <Input
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                placeholder="https://example.com/avatar.jpg"
                                                className="h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all pl-10"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-600 ml-1 italic">
                                            Dán liên kết hình ảnh để cập nhật hình đại diện.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                className="h-11 px-8 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-gray-600 dark:text-gray-400 transition-all"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy thay đổi
                            </Button>
                            <Button
                                onClick={() => updateProfile.mutate()}
                                disabled={updateProfile.isPending}
                                className="h-11 px-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                {updateProfile.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Lưu thay đổi
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
