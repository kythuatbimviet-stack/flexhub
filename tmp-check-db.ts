
import { createAdminClient } from './lib/supabase-server'

async function check() {
  const supabase = await createAdminClient()
  const tables = ['contracts', 'debts', 'revenue', 'expense', 'clients']
  
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    console.log(`${table}: ${count} records (error: ${error?.message || 'none'})`)
  }
}

check()
