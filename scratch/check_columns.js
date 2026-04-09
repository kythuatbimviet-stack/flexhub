const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching contracts:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in contracts table:', Object.keys(data[0]));
  } else {
    // If table is empty, we can try to get column info from information_schema
    const { data: colData, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'contracts' }); // This might not exist
    
    if (colError) {
      // Fallback: try a query that will definitely fail if the column is missing
      const { error: testError } = await supabase
        .from('contracts')
        .select('email_message')
        .limit(1);
      
      console.log('Test select email_message error:', testError ? testError.message : 'No error (column exists)');
    } else {
      console.log('Columns from RPC:', colData);
    }
  }
}

checkColumns();
