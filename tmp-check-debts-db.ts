
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    const { count, error } = await supabase
        .from('debts')
        .select('*', { count: 'exact', head: true })
    
    if (error) {
        console.error('Error fetching debts count:', error)
    } else {
        console.log('Total debts in DB:', count)
    }

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('email, permissions, position')
    
    if (userError) {
        console.error('Error fetching users:', userError)
    } else {
        console.log('Users in DB:', users)
    }
}

check()
