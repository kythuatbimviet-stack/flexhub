import { createClient } from './lib/supabase-server'

async function debug() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('branches').select('*').limit(1)
    console.log('Branches data:', JSON.stringify(data, null, 2))
}

debug()
