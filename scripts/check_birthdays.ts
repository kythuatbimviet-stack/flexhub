
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
  const { data, error } = await supabase.from('users').select('id, name, dob, email')
  if (error) {
    console.error(error)
    return
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  console.log('Current Month:', currentMonth)
  console.log('User Records:')
  
  data.forEach(u => {
    let month = null
    if (u.dob) {
        const d = new Date(u.dob)
        month = d.getUTCMonth() + 1
    }
    console.log(`- ${u.name} (${u.email}): DOB=${u.dob}, Extracted Month=${month}`)
  })
}

check()
