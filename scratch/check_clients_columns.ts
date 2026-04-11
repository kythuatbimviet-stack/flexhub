import { createClient } from './lib/supabase-server'

async function checkColumns() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clients').select('*').limit(1)
  if (error) {
    console.error(error)
    return
  }
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]))
  } else {
    console.log('No data found to check columns')
  }
}

checkColumns()
