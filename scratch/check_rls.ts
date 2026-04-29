import { createAdminClient } from './lib/supabase-server'

async function checkRLSPolicies() {
  const supabase = await createAdminClient()
  
  // Truy vấn trực tiếp từ bảng hệ thống pg_policies
  const { data, error } = await supabase.rpc('get_policies', { table_names: ['memberships', 'branches'] })
  
  // Nếu không có RPC get_policies, chúng ta sẽ dùng query trực tiếp qua SQL nếu có thể, 
  // hoặc dùng phương pháp khác. Ở đây tôi sẽ thử query qua bảng pg_policies bằng .from() 
  // (Lưu ý: Thường pg_policies không được expose qua PostgREST, nên ta dùng cách chắc chắn hơn là rpc hoặc một lệnh SQL nếu dự án có setup)
  
  // Cách thay thế: Dùng lệnh SQL trực tiếp qua một API có sẵn hoặc kiểm tra bằng cách thử truy vấn với các role khác nhau.
  // Tuy nhiên, tôi sẽ thử thực hiện một truy vấn SELECT đơn giản bằng client thông thường (không admin) 
  // để xem kết quả trả về có bị trống hay không, đó là cách kiểm tra thực tế nhất.
  
  console.log('--- ĐANG KIỂM TRA RLS ---')
  
  const { data: policies, error: pError } = await supabase
    .from('pg_policies')
    .select('*')
    .in('tablename', ['memberships', 'branches'])

  if (pError) {
    console.log('Không thể truy vấn pg_policies trực tiếp (đúng như dự đoán).')
    console.log('Thử kiểm tra quyền bằng cách truy vấn thử với client thường...')
  } else {
    console.log('Policies tìm thấy:', JSON.stringify(policies, null, 2))
  }
}

checkRLSPolicies()
