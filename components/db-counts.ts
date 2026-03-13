
import { createAdminClient } from '../lib/supabase-server';

async function checkCounts() {
  const supabase = createAdminClient();
  
  const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
  const { count: contractCount } = await supabase.from('contracts').select('*', { count: 'exact', head: true });
  const { count: revenueCount } = await supabase.from('revenue').select('*', { count: 'exact', head: true });
  const { count: expenseCount } = await supabase.from('expense').select('*', { count: 'exact', head: true });
  const { count: debtCount } = await supabase.from('debts').select('*', { count: 'exact', head: true });

  console.log('--- DATABASE STATUS ---');
  console.log('Clients:', clientCount);
  console.log('Contracts:', contractCount);
  console.log('Revenue:', revenueCount);
  console.log('Expense:', expenseCount);
  console.log('Debts:', debtCount);
  console.log('-----------------------');
}

checkCounts().catch(console.error);
