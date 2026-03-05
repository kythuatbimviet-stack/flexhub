import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirection URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && user) {
            // Sync user to custom users table using admin client to bypass RLS
            const adminClient = await createAdminClient()
            const { data: userData, error: userError } = await adminClient
                .from('users')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata.full_name || user.user_metadata.name || '',
                    avatar_url: user.user_metadata.avatar_url || '',
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'id'
                })

            if (userError) {
                console.error('Error syncing user:', userError)
            }

            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be more lenient with redirect origins in development
                return NextResponse.redirect(`${origin}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
