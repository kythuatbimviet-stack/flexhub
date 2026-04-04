
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log('Testing simple select on debt_installments...')
    const { error: err1 } = await supabase.from('debt_installments').select('*').limit(1)
    console.log('Debt_installments result:', err1 ? err1.message : 'SUCCESS')

    console.log('Testing join with revenue...')
    const { error: err2 } = await supabase.from('debt_installments').select('*, revenue:revenue_id(payment_method)').limit(1)
    console.log('Join result:', err2 ? err2.message : 'SUCCESS')
}

check()
