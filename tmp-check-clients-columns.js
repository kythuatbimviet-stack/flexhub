
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    const { data: firstClient, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1)
        .single()
    
    if (error) {
        console.error('Error fetching client:', error)
    } else {
        console.log('Columns in clients table:', Object.keys(firstClient))
    }
}

check()
