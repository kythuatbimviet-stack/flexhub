'use client'

import * as React from 'react'
import { User, Mail, Link as LinkIcon, Save, X, Loader2, Upload, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadImage } from '@/app/actions/storage'

export default function ProfilePage() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: profile, isLoading } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return null

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle()

            if (error) throw error
            return data
        }
    })

    const [fullName, setFullName] = React.useState('')
    const [avatarUrl, setAvatarUrl] = React.useState('')
    const [dob, setDob] = React.useState('')
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (profile) {
            setFullName(profile.name || '')
            setAvatarUrl(profile.avatar_url || '')
            setDob(profile.dob || '')
        }
    }, [profile])

    const updateProfile = useMutation({
        mutationFn: async () => {
            // Calculate age if dob is provided
            let age = null
            if (dob) {
                const birthDate = new Date(dob)
                const today = new Date()
                age = today.getFullYear() - birthDate.getFullYear()
                const m = today.getMonth() - birthDate.getMonth()
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--
                }
            }

            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName, avatar_url: avatarUrl }
            })
            if (authError) throw authError

            const { error: dbError } = await supabase
                .from('users')
                .update({
                    name: fullName,
                    avatar_url: avatarUrl,
                    dob: dob,
                    age: age,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile?.id)

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB')
            return
        }

        setIsUploading(true)
        const reader = new FileReader()
        reader.onload = async (event) => {
            const base64 = event.target?.result as string
            const fileName = `${profile?.id || Date.now()}-${file.name}`
            
            const result = await uploadImage(base64, fileName, 'avatars')
            if (result.success && result.url) {
                setAvatarUrl(result.url)
                toast.success('Đã tải ảnh lên thành công')
            } else {
                toast.error('Lỗi khi tải ảnh lên: ' + result.error)
            }
            setIsUploading(false)
        }
        reader.onerror = () => {
            toast.error('Lỗi khi đọc file')
            setIsUploading(false)
        }
        reader.readAsDataURL(file)
    }

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            </div>
        )
    }

    const initials = fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || profile?.email?.substring(0, 2).toUpperCase() || 'NV'

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 px-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/50">
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-black dark:text-white leading-none">Hồ sơ cá nhân</h1>
                    <p className="text-[12px] sm:text-sm text-slate-950 dark:text-gray-400 mt-1 font-medium">Quản lý và cập nhật thông tin cá nhân của bạn</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <Card className="border-none shadow-sm dark:shadow-none rounded-[32px] overflow-hidden bg-white dark:bg-gray-900 transition-all duration-300">
                    {/* Banner Decor */}
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400 relative" />

                    <div className="px-8 pb-8">
                        {/* Profile Identity */}
                        <div className="relative -mt-12 sm:-mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-8 sm:mb-10 text-center sm:text-left px-2 sm:px-0">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] sm:rounded-[40px] bg-red-600 border-4 border-white dark:border-gray-900 flex items-center justify-center text-white text-3xl sm:text-4xl font-semibold shadow-2xl overflow-hidden ring-4 ring-blue-500/5 transition-all hover:scale-105 duration-300">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div className="pb-2 space-y-1 sm:space-y-2">
                                <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white leading-tight tracking-tight">
                                    {fullName || 'Chưa cập nhật tên'}
                                </h2>
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <p className="text-[13px] sm:text-[15px] text-slate-950 dark:text-gray-400 font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                                        {profile?.email}
                                    </p>
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 sm:right-auto sm:left-24 translate-x-2 translate-y-1 sm:translate-x-4 sm:translate-y-[-4px]">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-0 shadow-lg hover:scale-110 transition-all text-slate-950 dark:text-white"
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Camera className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-6 sm:space-y-8">
                                <div className="space-y-4 sm:space-y-6">
                                    <h3 className="text-[12px] sm:text-sm font-bold text-black dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 uppercase tracking-widest">
                                        Thông tin cơ bản
                                    </h3>
                                    <div className="space-y-2">
                                        <label className="text-[11px] sm:text-xs font-semibold text-slate-950 dark:text-gray-400 ml-1 uppercase tracking-wider">
                                            Họ và tên
                                        </label>
                                        <div className="relative group">
                                            <Input
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Nhập họ và tên..."
                                                className="h-11 sm:h-12 bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all pl-4 text-black text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] sm:text-xs font-semibold text-slate-950 dark:text-gray-400 ml-1 uppercase tracking-wider">
                                                Địa chỉ Email
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    value={profile?.email}
                                                    disabled
                                                    className="h-11 sm:h-12 bg-slate-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 rounded-xl sm:rounded-2xl text-slate-400 dark:text-gray-600 cursor-not-allowed pl-4 text-xs font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] sm:text-xs font-semibold text-slate-950 dark:text-gray-400 ml-1 uppercase tracking-wider">
                                                Ngày sinh nhật
                                            </label>
                                            <div className="relative group">
                                                <Input
                                                    type="date"
                                                    value={dob}
                                                    onChange={(e) => setDob(e.target.value)}
                                                    className="h-11 sm:h-12 bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-4 text-black text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Avatar Info */}
                            <div className="space-y-6 sm:space-y-8">
                                <div className="space-y-4 sm:space-y-6">
                                    <h3 className="text-[12px] sm:text-sm font-bold text-black dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 uppercase tracking-widest">
                                        Hình đại diện
                                    </h3>
                                    <div className="space-y-2">
                                        <label className="text-[11px] sm:text-xs font-semibold text-slate-950 dark:text-gray-400 ml-1 uppercase tracking-wider">
                                            Đường dẫn ảnh (URL)
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <LinkIcon className="w-4 h-4" />
                                            </div>
                                            <Input
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                placeholder="https://example.com/avatar.jpg"
                                                className="h-11 sm:h-12 bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all pl-10 pr-24 text-sm font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5"
                                            >
                                                <Upload className="w-3 h-3" />
                                                CHỌN FILE
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 dark:text-gray-600 ml-1 italic font-medium leading-relaxed mt-1">
                                            Cập nhật liên kết hình ảnh để thay đổi avatar hiển thị trên hệ thống.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-1 sm:px-0">
                            <Button
                                variant="ghost"
                                className="h-11 sm:h-12 px-8 rounded-xl sm:rounded-2xl border-transparent hover:bg-slate-50 dark:hover:bg-gray-800 font-semibold text-slate-950 dark:text-gray-400 transition-all active:scale-95"
                                onClick={() => {
                                    setFullName(profile.name || '')
                                    setAvatarUrl(profile.avatar_url || '')
                                    setDob(profile.dob || '')
                                }}
                            >
                                <X className="w-4 h-4 mr-2" />
                                <span className="text-sm">Hủy thay đổi</span>
                            </Button>
                            <Button
                                onClick={() => updateProfile.mutate()}
                                disabled={updateProfile.isPending}
                                className="h-11 sm:h-12 px-10 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                            >
                                {updateProfile.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                <span className="text-sm">Lưu thay đổi</span>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
