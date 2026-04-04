
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    // 1. Get first debt record to see internal columns
    const { data: firstDebt, error } = await supabase
        .from('debts')
        .select('*')
        .limit(1)
        .single()
    
    if (error) {
        console.error('Error fetching debt:', error)
    } else {
        console.log('Columns in debts table:', Object.keys(firstDebt))
    }

    // 2. Check a few records for contracts and branches
    const { data, error: selectError } = await supabase
        .from('debts')
        .select('*, contracts(*), branches(*)')
        .limit(2)
    
    if (selectError) {
        console.error('Join query error:', selectError)
    } else {
        console.log('Join query success, records count:', data.length)
        if (data.length > 0) {
            console.log('First record relations:', {
                hasContract: !!data[0].contracts,
                hasBranch: !!data[0].branches,
                branch: data[0].branches?.name,
                contractId: data[0].contract_id
            })
        }
    }
}

check()
