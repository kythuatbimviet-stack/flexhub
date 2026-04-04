
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log('Attempting to fetch debt_installments with SERVICE_ROLE...')
    const { data, error, count } = await supabase
        .from('debt_installments')
        .select('*', { count: 'exact', head: true })
    
    if (error) {
        console.error('Error:', error.message)
        console.error('Code:', error.code)
    } else {
        console.log('Success! Count:', count)
    }
}

check()
