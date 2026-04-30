
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
    console.log('Checking exercises table...')
    
    const { data, count, error } = await supabase
        .from('exercises')
        .select('*', { count: 'exact' })
    
    if (error) {
        console.error('Error fetching exercises:', error)
    } else {
        console.log('Total exercises count:', count)
        console.log('Sample data (first 3):', data.slice(0, 3))
    }

    const { data: tp, error: tpError } = await supabase
        .from('training_programs')
        .select('name')
        .limit(5)
    
    if (tpError) {
        console.error('Error fetching programs:', tpError)
    } else {
        console.log('Sample programs:', tp)
    }
}

check()
