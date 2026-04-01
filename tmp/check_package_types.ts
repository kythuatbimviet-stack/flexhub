import { createAdminClient } from './lib/supabase-server'

async function check() {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('memberships')
        .select('package_type')
    
    if (error) {
        console.error(error)
        return
    }

    const unique = Array.from(new Set(data.map(d => d.package_type)))
    console.log('Unique package_type values:', unique)
}

check()
