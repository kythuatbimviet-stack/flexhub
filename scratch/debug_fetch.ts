import { fetchMemberships } from './app/actions/memberships'

async function debugFetch() {
  console.log('--- ĐANG DEBUG FETCH MEMBERSHIPS ---')
  const result = await fetchMemberships()
  
  if (result.success) {
    console.log('Fetch THÀNH CÔNG.')
    console.log('Số lượng bản ghi:', result.data?.length || 0)
    if (result.data && result.data.length > 0) {
      console.log('Ví dụ bản ghi đầu tiên:', JSON.stringify(result.data[0], null, 2))
    }
  } else {
    console.error('Fetch THẤT BẠI.')
    console.error('Lỗi chi tiết:', result.error)
  }
}

debugFetch()
