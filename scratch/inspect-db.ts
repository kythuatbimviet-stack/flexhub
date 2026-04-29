
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function inspectTables() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('--- Checking TABLE: users ---')
    const { data: users, error: usersError } = await supabase.from('users').select('email, permissions')
    if (usersError) console.error('Error fetching users:', usersError)
    else console.log('Users found:', users)

    console.log('\n--- Checking TABLE: profiles ---')
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('email, role')
    if (profilesError) console.error('Error fetching profiles:', profilesError)
    else console.log('Profiles found:', profiles)
}

inspectTables()
