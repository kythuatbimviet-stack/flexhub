
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

async function checkConstraints() {
  console.log('Testing email uniqueness...')
  const testEmail = 'test_unique_' + Date.now() + '@example.com'
  
  const { error: insertError } = await supabase.from('users').insert({ 
    id: '00000000-0000-0000-0000-000000000001',
    email: testEmail, 
    name: 'Test' 
  })
  
  if (insertError) {
      console.log('Initial insert failed:', insertError.message)
  }

  const { error: dupeError } = await supabase.from('users').insert({ 
    id: '00000000-0000-0000-0000-000000000002',
    email: testEmail, 
    name: 'Test 2' 
  })
  
  if (dupeError && (dupeError.message.includes('unique') || dupeError.code === '23505')) {
      console.log('SUCCESS: Email HAS a unique constraint (or primary key conflict). Code:', dupeError.code)
  } else if (!dupeError) {
      console.log('WARNING: Email DOES NOT have a unique constraint (inserted duplicate email successfully).')
      // Cleanup
      await supabase.from('users').delete().ilike('email', testEmail)
  } else {
      console.log('Error testing uniqueness:', dupeError.message)
  }
}

checkConstraints()
