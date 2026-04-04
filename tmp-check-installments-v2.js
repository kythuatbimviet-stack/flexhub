
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log('Attempting to fetch debt_installments with SERVICE_ROLE...')
    const { data, error } = await supabase
        .from('debt_installments')
        .select('*')
        .limit(1)
    
    if (error) {
        console.error('Full Error Object:', JSON.stringify(error, null, 2))
    } else {
        console.log('Success! Data:', data)
    }
}

check()
