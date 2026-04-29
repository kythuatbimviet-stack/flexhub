import { createAdminClient } from './lib/supabase-server'

async function checkCurrentUserBranch() {
  const supabase = await createAdminClient()
  
  // Kiểm tra danh sách user và chi nhánh tương ứng
  const { data: users, error } = await supabase
    .from('users')
    .select('email, name, branch_id, branches(name)')
  
  console.log('--- DANH SÁCH NHÂN SỰ VÀ CHI NHÁNH ---')
  if (error) {
    console.error('Lỗi khi truy vấn bảng users:', error.message)
  } else {
    console.table(users.map(u => ({
      Email: u.email,
      Ten: u.name,
      ID_ChiNhanh: u.branch_id,
      Ten_ChiNhanh: u.branches?.name || 'Chưa gán'
    })))
  }
}

checkCurrentUserBranch()
