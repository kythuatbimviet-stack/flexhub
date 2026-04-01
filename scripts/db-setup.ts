
import { createAdminClient } from './lib/supabase-server'

async function setup() {
  const supabase = await createAdminClient()
  
  // 1. Add "Tự kiếm" to config_client_source
  console.log('Adding "Tự kiếm" to config_client_source...')
  const { data: source, error: sourceError } = await supabase
    .from('config_client_source')
    .upsert({ nam: 'Tự kiếm', is_default: false }, { onConflict: 'nam' })
  
  if (sourceError) console.error('Error adding source:', sourceError.message)
  else console.log('Source added successfully.')

  // 2. Add "province" column to "branches" table using RPC (if available) or assume it exists after manual check
  // Since I can't run SQL directly easily, I'll try to check if I can add it via a raw query if Supabase allows, 
  // but usually it doesn't without a migration or RPC.
  // Wait, I can't run ALTER TABLE via supabase-js easily unless there's an RPC.
  
  // Let's check if the column already exists first.
  const { data: branch, error: branchError } = await supabase.from('branches').select('*').limit(1).single()
  if (branch && !('province' in branch)) {
    console.log('Column "province" does not exist in "branches".')
    // I will try to use the 'sql' RPC if it exists, common in some Supabase setups for internal tools.
    // Otherwise, I'll have to ask the user to add it through the dashboard or use a different approach.
    // Let's try to run a simple alter table if possible.
    const { error: alterError } = await supabase.rpc('run_sql', { sql: 'ALTER TABLE branches ADD COLUMN IF NOT EXISTS province TEXT;' })
    if (alterError) {
      console.error('Could not add column via RPC:', alterError.message)
    } else {
      console.log('Column "province" added successfully via RPC.')
    }
  } else if (branchError) {
    console.error('Error checking branches table:', branchError.message)
  } else {
    console.log('Column "province" already exists or branch data is empty.')
  }
}

setup()
