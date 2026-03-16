import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * API Route: GET /api/contract-template-v3
 * Trả về nội dung file hop_dong_template.html (template mới V3)
 * để client có thể load và dùng với getContractHTMLV3().
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'contracts_template', 'hop_dong_template.html')
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'hop_dong_template.html not found' }, { status: 404 })
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
