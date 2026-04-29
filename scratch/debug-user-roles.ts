
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function debugUser() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const email = 'kythuatbimviet@gmail.com'

    console.log(`Checking email: ${email}`)

    const { data: profile } = await supabase.from('profiles').select('*').ilike('email', email).maybeSingle()
    console.log('Profile:', profile)

    const { data: staff } = await supabase.from('users').select('*').ilike('email', email).maybeSingle()
    console.log('Staff:', staff)

    const { data: client } = await supabase.from('clients').select('*').ilike('email', email).maybeSingle()
    console.log('Client:', client)
}

debugUser()
