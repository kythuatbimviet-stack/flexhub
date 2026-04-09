const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBranches() {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name, url_guimail');

  if (error) {
    console.error('Error fetching branches:', error.message);
    return;
  }

  console.log('Branches data:', JSON.stringify(data, null, 2));
}

checkBranches();
