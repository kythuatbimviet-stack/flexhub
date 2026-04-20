
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

async function checkUser() {
  const email = 'tungtraucay@gmail.com'
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  console.log('Users found in "users" table with email:', email)
  console.table(users.map(u => ({ id: u.id, name: u.name, email: u.email, created_at: u.created_at })))

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error('Error listing auth users:', authError)
  } else {
    const authUser = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (authUser) {
        console.log('Auth User ID:', authUser.id)
        console.log('Auth User metadata:', JSON.stringify(authUser.user_metadata, null, 2))
    } else {
        console.log('No Auth User found for email:', email)
    }
  }
}

checkUser()
