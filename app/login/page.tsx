'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Dumbbell } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { useQueryClient } from '@tanstack/react-query'
import { del } from 'idb-keyval'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [loading, setLoading] = React.useState(false)
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
            
            // Clear all caches before proceeding to dashboard
            queryClient.clear()
            try {
                await del('gymcrm-cache-v1')
            } catch (e) {
                console.error('Failed to clear persistent cache:', e)
            }

            router.push('/')
        } catch (error: any) {
            toast.error(error.message || 'Đã xảy ra lỗi khi đăng nhập')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (error: any) {
            toast.error(error.message || 'Đã xảy ra lỗi khi đăng nhập với Google')
        }
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
            {/* Left Side: Branding & Image */}
            <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden bg-red-600">
                {/* Background Image with Red Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-multiply"
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop")',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-red-700/50 to-red-900/80" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-white mb-12">
                        <span className="text-2xl font-bold tracking-tight">
                            Eva's Fit <span className="text-red-600 dark:text-white font-semibold text-[10px] ml-1 px-2 py-0.5 bg-white dark:bg-red-900/30 rounded-full tracking-wider">CRM</span>
                        </span>
                    </div>
                </div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 max-w-md">
                            Hệ thống quản lý phòng tập hiện đại.
                        </h1>
                        <p className="text-white/80 text-lg max-w-sm leading-relaxed">
                            Tối ưu hóa quy trình, nâng cao trải nghiệm khách hàng và quản lý tài chính hiệu quả với Eva's Fit.
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <div className="h-px w-12 bg-white/40" />
                    <span className="text-white/40 text-xs tracking-[0.3em] uppercase font-medium">Eva's Fit Team Product</span>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-md space-y-10"
                >
                    <div className="text-center">
                        <div className="mb-10 flex justify-center">
                            <Logo
                                variant="horizontal"
                                className="h-48 md:h-64 lg:h-80 w-auto drop-shadow-2xl"
                                priority
                            />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Chào mừng trở lại</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Đăng nhập để truy cập vào hệ thống quản lý</p>
                    </div>

                    <div className="space-y-6">
                        <Button
                            onClick={handleGoogleLogin}
                            className="w-full bg-gradient-to-r from-[#e11d48] to-[#f97316] text-white font-semibold h-12 rounded-xl border-none shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.01] transition-all duration-300"
                        >
                            <svg className="w-5 h-5 mr-3 fill-white" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff/20" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff/20" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff/20" />
                            </svg>
                            Đăng nhập qua Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100 dark:border-gray-800"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-gray-950 px-4 text-gray-400 font-medium tracking-widest">
                                    Hoặc
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium ml-1">Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="admin@evafit.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-gray-50/50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white pl-12 h-14 rounded-2xl focus:ring-red-500 focus:border-red-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium ml-1">Mật khẩu</Label>
                                    <button type="button" className="text-red-600 dark:text-red-400 text-xs font-semibold hover:underline">
                                        Quên mật khẩu?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-gray-50/50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white pl-12 h-14 rounded-2xl focus:ring-red-500 focus:border-red-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold h-14 rounded-2xl mt-6 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang xử lý...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <LogIn className="w-4 h-4" />
                                        Đăng nhập hệ thống
                                    </div>
                                )}
                            </Button>
                        </form>

                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Tài khoản dùng thử</p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const { error } = await supabase.auth.signInWithPassword({
                                                email: 'admin@evafit.com',
                                                password: 'admin',
                                            })
                                            if (error) throw error
                                            
                                            // Clear cache on quick login
                                            queryClient.clear()
                                            try { await del('gymcrm-cache-v1') } catch (e) { console.error('Failed to clear persistent cache:', e) }

                                            router.push('/')
                                        } catch (error: any) {
                                            toast.error(error.message || 'Đã xảy ra lỗi khi đăng nhập nhanh')
                                        }
                                    }}
                                    className="text-[10px] h-10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all border-gray-100 dark:border-gray-800"
                                >
                                    Admin
                                </Button>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const { error } = await supabase.auth.signInWithPassword({
                                                email: 'demo1@evafit.com',
                                                password: '12345',
                                            })
                                            if (error) throw error
                                            
                                            // Clear cache on quick login
                                            queryClient.clear()
                                            try { await del('gymcrm-cache-v1') } catch (e) { console.error('Failed to clear persistent cache:', e) }

                                            router.push('/')
                                        } catch (error: any) {
                                            toast.error(error.message || 'Đã xảy ra lỗi khi đăng nhập nhanh')
                                        }
                                    }}
                                    className="text-[10px] h-10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all border-gray-100 dark:border-gray-800"
                                >
                                    Staff
                                </Button>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const { error } = await supabase.auth.signInWithPassword({
                                                email: 'demo2@evafit.com',
                                                password: '12345',
                                            })
                                            if (error) throw error
                                            
                                            // Clear cache on quick login
                                            queryClient.clear()
                                            try { await del('gymcrm-cache-v1') } catch (e) { console.error('Failed to clear persistent cache:', e) }

                                            router.push('/')
                                        } catch (error: any) {
                                            toast.error(error.message || 'Đã xảy ra lỗi khi đăng nhập nhanh')
                                        }
                                    }}
                                    className="text-[10px] h-10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all border-gray-100 dark:border-gray-800"
                                >
                                    Branch Mgr
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                            Bằng việc đăng nhập, bạn đồng ý với <span className="underline cursor-pointer">Điều khoản dịch vụ</span> và <span className="underline cursor-pointer">Chính sách bảo mật</span> của chúng tôi.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
