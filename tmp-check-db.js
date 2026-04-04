
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log('Checking database...')
    
    // 1. Check Debts Count
    const { count, error: countError } = await supabase
        .from('debts')
        .select('*', { count: 'exact', head: true })
    
    if (countError) {
        console.error('Error fetching debts count:', countError)
    } else {
        console.log('Total debts records in public.debts:', count)
    }

    // 2. Check if there are any related contracts
    const { data: sampleDebts, error: sampleError } = await supabase
        .from('debts')
        .select('id, contract_id')
        .limit(5)
    
    if (sampleError) {
        console.error('Error fetching sample debts:', sampleError)
    } else {
        console.log('Sample debts (showing link to contracts):', sampleDebts)
    }

    // 3. List Admin Users
    const { data: adminUsers, error: userError } = await supabase
        .from('users')
        .select('name, email, permissions, position')
    
    if (userError) {
        console.error('Error fetching users:', userError)
    } else {
        console.log('Users in DB:', adminUsers)
    }
}

check()
