
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simulate() {
  console.log('Simulating fetchStaffBirthdays...')
  
  // Directly mimic the logic in birthdays.ts
  const { data, error } = await supabase.from('users').select(`
            id,
            name,
            phone,
            email,
            dob,
            age,
            avatar_url,
            branch_id,
            position,
            department
        `)

  if (error) {
    console.error(error)
    return
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  console.log('Current Month:', currentMonth)

  const filtered = (data || []).filter((user: any) => {
    if (!user.dob) return false
    const dob = new Date(user.dob)
    const birthMonth = dob.getMonth() + 1
    return birthMonth === currentMonth
  })

  console.log('Total birthdays found for this month:', filtered.length)
  filtered.forEach(p => console.log(`- ${p.name} (${p.email}) - DOB: ${p.dob}`))
}

simulate()
