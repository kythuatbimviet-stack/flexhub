
import { createAdminClient } from './app/actions/supabase-server';

async function checkSchema() {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'contracts' });
    if (error) {
        // If RPC doesn't exist, try a simple query and check keys of the first row
        const { data: firstRow } = await supabase.from('contracts').select('*').limit(1).single();
        console.log('Columns:', Object.keys(firstRow || {}));
    } else {
        console.log('Columns:', data);
    }
}

checkSchema();
