
import { createAdminClient } from './lib/supabase-server'

async function check() {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from('weight_tracking').select('*').limit(1)
    console.log('Sample record:', data?.[0])
}

check()
