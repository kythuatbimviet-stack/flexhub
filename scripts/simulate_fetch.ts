
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simulate() {
  const email = 'tungtraucay@gmail.com'
  console.log('Simulating fetchMyDefinitiveProfileByEmail for:', email)

  // 1. Check if user exists in auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  const authUser = authUsers.users.find(u => u.email === email)
  
  if (!authUser) {
    console.log('No Auth User found.')
    return
  }
  console.log('Auth User ID:', authUser.id)

  // 2. Query public.users
  const { data: allRows, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)

  console.log('Rows found in "users":', allRows?.length)

  if (!allRows || allRows.length === 0) {
    console.log('Triggering "New User" auto-creation logic...')
    const newUser = {
        id: authUser.id,
        email: email,
        name: authUser.user_metadata?.full_name || email.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url || '',
        status: 'Activated',
        position: 'Nhân viên'
    }
    console.log('Inserting:', JSON.stringify(newUser, null, 2))
    
    const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single()
    
    if (insertError) {
        console.error('Insert Error:', insertError.message, insertError.code)
    } else {
        console.log('Insert SUCCESS:', JSON.stringify(inserted, null, 2))
    }
  } else {
    console.log('Existing rows found. Checking ID match...')
    const idMatched = allRows.find(r => r.id === authUser.id)
    if (idMatched) {
        console.log('ID Match SUCCESS:', JSON.stringify(idMatched, null, 2))
    } else {
        console.log('Legacy match. Best record:', JSON.stringify(allRows[0], null, 2))
    }
  }
}

simulate()
