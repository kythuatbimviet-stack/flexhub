import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && user) {
            // ─── Sync vào public.profiles (tự động cho mọi user đăng nhập Google) ───
            const adminClient = await createAdminClient()

            const { error: profileError } = await adminClient
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name
                        || user.user_metadata?.name
                        || user.email?.split('@')[0]
                        || '',
                    avatar_url: user.user_metadata?.avatar_url || null,
                    updated_at: new Date().toISOString(),
                    // role giữ nguyên default 'guest' nếu là user mới
                    // nếu đã có record thì upsert không ghi đè role
                }, {
                    onConflict: 'id',
                    ignoreDuplicates: false,
                })

            if (profileError) {
                console.error('[auth/callback] Error syncing to profiles:', profileError.message)
            } else {
                console.log('[auth/callback] Profile synced for:', user.email)
            }

            // ─── KHÔNG tự ghi vào public.users ───────────────────────────────────
            // public.users được admin quản lý thủ công để phân quyền nội bộ

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
