import { createAdminClient } from './lib/supabase-server'

async function checkData() {
  const supabase = await createAdminClient()
  const { data: memberships, error } = await supabase.from('memberships').select('*').limit(5)
  console.log('Memberships:', JSON.stringify(memberships, null, 2))
  
  const { data: branches, error: bError } = await supabase.from('branches').select('*').limit(5)
  console.log('Branches:', JSON.stringify(branches, null, 2))
}

checkData()
