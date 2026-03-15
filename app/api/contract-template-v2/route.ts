import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * API Route: GET /api/contract-template-v2
 * Trả về nội dung file contracts.html (template chuẩn ảnh mẫu V2)
 * để client có thể load và dùng với getContractHTMLV2().
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'contracts_template', 'contracts.html')
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'contracts.html not found' }, { status: 404 })
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Trả về raw HTML content (không phải JSON)
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store', // không cache để admin có thể update
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
