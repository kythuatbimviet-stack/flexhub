
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function setup() {
  // 1. Add "Tự kiếm" safely
  console.log('Adding "Tự kiếm" to config_client_source...')
  const { data: existing } = await supabase.from('config_client_source').select('nam').eq('nam', 'Tự kiếm').maybeSingle()
  
  if (!existing) {
    const { error: insertError } = await supabase.from('config_client_source').insert({ nam: 'Tự kiếm', is_default: false })
    if (insertError) console.error('Error adding source:', insertError.message)
    else console.log('Source "Tự kiếm" added successfully.')
  } else {
    console.log('Source "Tự kiếm" already exists.')
  }
}

setup()
