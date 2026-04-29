import { createAdminClient } from './lib/supabase-server'

async function checkUser() {
  const supabase = await createAdminClient()
  const { data: users, error } = await supabase.from('users').select('*')
  console.log('Users in public.users:', JSON.stringify(users, null, 2))
}

checkUser()
