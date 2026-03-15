'use client'

import * as React from 'react'
import { numberToVietnameseWords } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// ---------- Template-based HTML builder (uses custom template from DB) ----------
// ---------- Template-based HTML builder (uses custom template from DB) ----------
export function getContractHTMLFromTemplate(
  contract: any,
  templateContent: string,
  dynamicPlaceholders: any[] = []
): string {
  if (!contract || !templateContent) return ''

  const formatCurrency = (amount: number) => {
    if (!amount) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '.../.../...'
    try { return new Date(dateStr).toLocaleDateString('vi-VN') } catch { return '.../.../...' }
  }

  let totalWords = ''
  try { totalWords = contract.total_amount_text || (contract.total_amount ? numberToVietnameseWords(contract.total_amount) + ' đồng chẵn' : '') } catch { totalWords = '' }

  let packagePriceWords = ''
  try { packagePriceWords = contract.package_price_text || (contract.package_price ? numberToVietnameseWords(contract.package_price) + ' đồng chẵn' : '') } catch { packagePriceWords = '' }

  let discountedPriceWords = ''
  try { discountedPriceWords = contract.discounted_price_text || (contract.discounted_price ? numberToVietnameseWords(contract.discounted_price) + ' đồng chẵn' : '') } catch { discountedPriceWords = '' }

  const centerName = contract.facility_name || contract.branches?.name || 'TRUNG TÂM EVA FIT'
  const centerShortName = contract.short_name || 'EVA FIT'

  // 1. Start with the "hardcoded" core mappings that need logic
  const map: Record<string, string> = {
    '{{member_name}}': (contract.member_name || '').toUpperCase(),
    '{{phone}}': contract.phone || '',
    '{{email}}': contract.email || '',
    '{{dob}}': formatDate(contract.dob),
    '{{address}}': contract.member_address || contract.address || '',
    '{{id_number}}': contract.id_number || '',
    '{{package_name}}': contract.package_name || '',
    '{{total_sessions}}': String(contract.total_sessions || ''),
    '{{start_date}}': formatDate(contract.start_date),
    '{{end_date}}': formatDate(contract.end_date),
    '{{total_amount}}': formatCurrency(contract.total_amount),
    '{{total_amount_words}}': totalWords,
    '{{trainer_name}}': contract.trainer_name || 'Đang cập nhật',
    '{{trainer_type}}': contract.trainer_type || 'Trực tiếp',
    // Giá gói
    '{{package_price}}': contract.package_price ? formatCurrency(contract.package_price) : '',
    '{{package_price_words}}': packagePriceWords,
    '{{discounted_price}}': contract.discounted_price ? formatCurrency(contract.discounted_price) : '',
    '{{discounted_price_words}}': discountedPriceWords,
    '{{center_representative}}': contract.center_representative || '',
    '{{center_name}}': centerName,
    '{{center_short_name}}': centerShortName,
    '{{contract_id}}': contract.id || '',
    '{{signing_date}}': formatDate(contract.signing_date),
    '{{payment_method}}': contract.payment_method || '',
    '{{initial_height}}': String(contract.initial_height || ''),
    '{{initial_weight}}': String(contract.initial_weight || ''),
    '{{medical_condition}}': contract.medical_condition || 'Không',
    '{{branch_name}}': contract.branches?.name || '',
    '{{account_number}}': contract.account_number || '',
    '{{bank_name}}': contract.bank_name || '',
    '{{account_holder}}': contract.account_holder || '',
    // Branch-sourced fields
    '{{center_phone}}': contract.branches?.center_phone || contract.center_phone || '',
    '{{center_address}}': contract.branches?.center_address || contract.address || '',
    '{{legal_representative}}': contract.branches?.legal_representative || '',
    '{{representative_phone}}': contract.branches?.representative_phone || '',
  }

  // 2. Overlay dynamic placeholders from DB (only if they aren't already handled or if we want to override)
  // Also allows supporting custom placeholders if they match a field in the contract object
  dynamicPlaceholders.forEach(p => {
    if (!map[p.key]) {
      // Try to find a match in the contract object if the key is simple (e.g. {{something}})
      const cleanKey = p.key.replace(/[{}]/g, '')
      if (contract[cleanKey] !== undefined) {
        let val = contract[cleanKey]
        if (typeof val === 'number' && (cleanKey.includes('amount') || cleanKey.includes('price'))) {
          val = formatCurrency(val)
        } else if (cleanKey.includes('date')) {
          val = formatDate(val)
        }
        map[p.key] = String(val ?? '')
      }
    }
  })

  let body = templateContent
  Object.entries(map).forEach(([key, val]) => {
    body = body.replaceAll(key, val)
  })

  // Wrap with minimal print-ready shell
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Hợp Đồng - ${contract.member_name || ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13px;
      line-height: 1.7;
      color: #000;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm 20mm 16mm 20mm;
      overflow-wrap: break-word;
      word-wrap: break-word;
      word-break: break-word;
    }
    /* Đảm bảo mọi phần tử con không tràn ra ngoài khổ giấy */
    .page * {
      max-width: 100%;
    }
    .page table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }
    .page img {
      height: auto;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 14mm 18mm; }
    }
  </style>
</head>
<body>
<div class="page">${body}</div>
</body>
</html>`
}

// ---------- CONFIG values (read from config/config.md convention) ----------
// These values can be updated in config/config.md by admin
const CONTRACT_CONFIG = {
  LOGO_URL: 'https://cdn-icons-png.flaticon.com/128/281/281764.png',
  HOTLINE: '0832 646 686',
}

// ---------- V2 Template builder (uses fixed contracts.html — chuẩn ảnh mẫu) ----------
export function getContractHTMLV2(
  contract: any,
  templateContent: string,
  dynamicPlaceholders: any[] = []
): string {
  if (!contract || !templateContent) return ''

  const formatCurrency = (amount: number) => {
    if (!amount) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '............'
    try { return new Date(dateStr).toLocaleDateString('vi-VN') } catch { return '............' }
  }

  let totalWords = ''
  try { totalWords = contract.total_amount_text || (contract.total_amount ? numberToVietnameseWords(contract.total_amount) + ' đồng chẵn' : '') } catch { totalWords = '' }
  let packagePriceWords = ''
  try { packagePriceWords = contract.package_price_text || (contract.package_price ? numberToVietnameseWords(contract.package_price) + ' đồng chẵn' : '') } catch { packagePriceWords = '' }
  let discountedPriceWords = ''
  try { discountedPriceWords = contract.discounted_price_text || (contract.discounted_price ? numberToVietnameseWords(contract.discounted_price) + ' đồng chẵn' : '') } catch { discountedPriceWords = '' }

  const centerName = contract.facility_name || contract.branches?.name || 'TRUNG TÂM EVA FIT'
  const centerShortName = contract.short_name || 'EVA FIT'

  // Signature image HTML
  const sigHtml = contract.signature_url
    ? `<img src="${contract.signature_url}" style="max-height:60pt;max-width:120pt;object-fit:contain;display:block;margin:4pt auto;" alt="Chữ ký"/>`
    : `<div style="height:60pt;"></div>`

  const map: Record<string, string> = {
    '{{member_name}}': (contract.member_name || '').toUpperCase(),
    '{{phone}}': contract.phone || '',
    '{{email}}': contract.email || '',
    '{{dob}}': formatDate(contract.dob),
    '{{address}}': contract.member_address || contract.address || '',
    '{{id_number}}': contract.id_number || '......................',
    '{{package_name}}': contract.package_name || '',
    '{{total_sessions}}': String(contract.total_sessions || ''),
    '{{start_date}}': formatDate(contract.start_date),
    '{{end_date}}': formatDate(contract.end_date),
    '{{total_amount}}': formatCurrency(contract.total_amount),
    '{{total_amount_words}}': totalWords,
    '{{trainer_name}}': contract.trainer_name || 'Đang cập nhật',
    '{{trainer_type}}': contract.trainer_type || 'Trực tiếp',
    '{{package_price}}': contract.package_price ? formatCurrency(contract.package_price) : '',
    '{{package_price_words}}': packagePriceWords,
    '{{discounted_price}}': contract.discounted_price ? formatCurrency(contract.discounted_price) : '',
    '{{discounted_price_words}}': discountedPriceWords,
    '{{center_representative}}': contract.center_representative || '',
    '{{center_name}}': centerName,
    '{{center_short_name}}': centerShortName,
    '{{contract_id}}': contract.id || '',
    '{{signing_date}}': formatDate(contract.signing_date),
    '{{payment_method}}': contract.payment_method || '',
    '{{initial_height}}': String(contract.initial_height || ''),
    '{{initial_weight}}': String(contract.initial_weight || ''),
    '{{medical_condition}}': contract.medical_condition || 'Không',
    '{{branch_name}}': contract.branches?.name || '',
    '{{account_number}}': contract.account_number || '',
    '{{bank_name}}': contract.bank_name || '',
    '{{account_holder}}': contract.account_holder || '',
    '{{center_phone}}': contract.branches?.center_phone || contract.center_phone || '',
    '{{center_address}}': contract.branches?.center_address || contract.address || '',
    '{{legal_representative}}': contract.legal_representative || contract.branches?.legal_representative || '......................',
    '{{representative_phone}}': contract.representative_phone || contract.branches?.representative_phone || '......................',
    // V2 config values
    '{{logo_url}}': CONTRACT_CONFIG.LOGO_URL,
    '{{hotline}}': CONTRACT_CONFIG.HOTLINE,
    // Chữ ký hội viên
    '{{signature_url}}': sigHtml,
  }

  dynamicPlaceholders.forEach(p => {
    if (!map[p.key]) {
      const cleanKey = p.key.replace(/[{}]/g, '')
      if (contract[cleanKey] !== undefined) {
        let val = contract[cleanKey]
        if (typeof val === 'number' && (cleanKey.includes('amount') || cleanKey.includes('price'))) val = formatCurrency(val)
        else if (cleanKey.includes('date')) val = formatDate(val)
        map[p.key] = String(val ?? '')
      }
    }
  })

  // Lấy phần nội dung từ contracts.html (bên trong <body>...</body>)
  // Loại bỏ <html>, <head>, <body> tags để nhúng vào shell mới
  let bodyContent = templateContent
  const bodyMatch = templateContent.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (bodyMatch) bodyContent = bodyMatch[1]

  // Thay thế tất cả placeholders
  Object.entries(map).forEach(([key, val]) => {
    bodyContent = bodyContent.replaceAll(key, val)
  })

  // Footer HTML là element bình thường (html2canvas capture được, print cũng hiện)
  const footerHtml = `
<div class="v2-footer" style="
  margin-top: 16pt;
  padding: 6pt 0 4pt;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9pt;
  font-family: 'Nunito Sans', Arial, sans-serif;
">
  <span style="color:#ee5b5c; font-weight:600;">Hotline: ${CONTRACT_CONFIG.HOTLINE}</span>
  <span style="color:#555;">Trang 1</span>
</div>`

  // CSS shell V2:
  // - font Nunito Sans
  // - body có padding 18mm (giống trang A4)
  // - @page disable browser header/footer mặc định (margin 0 ở các cạnh để tắt browser header)
  // - KHÔNG dùng table-layout:fixed (tránh méo cột bảng GDocs)
  // - Màu nền bảng được giữ nguyên khi in
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=794px"/>
  <title>Hợp Đồng - ${contract.member_name || ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 794px;
      background: #fff;
      color: #000;
    }
    body {
      font-family: 'Nunito Sans', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      padding: 18mm 18mm 12mm 18mm;
    }
    /* Giữ màu nền bảng khi in */
    @media print {
      html, body { width: 210mm; }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* Tắt browser header/footer mặc định (ngày giờ, tên trang) */
      @page {
        size: A4;
        margin: 0;
      }
      body {
        padding: 12mm 18mm 10mm 18mm;
      }
    }
    /* Bảng GDocs: KHÔNG force width để tránh méo cột */
    table { border-collapse: collapse; }
    p, div, span { font-family: 'Nunito Sans', Arial, sans-serif; }
    /* Header logo */
    .pdf-page-header img { display: block; }
    .pdf-page-header div { font-family: 'Nunito Sans', Arial, sans-serif !important; }
  </style>
</head>
<body>
${bodyContent}
${footerHtml}
</body>
</html>`
}

// ---------- Standalone HTML builder for window.print() ----------

export function getContractHTML(contract: any): string {

  if (!contract) return ''

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '.../.../...'
    try { return new Date(dateStr).toLocaleDateString('vi-VN') } catch { return '.../.../...' }
  }

  const centerName = contract.facility_name || contract.branches?.name || 'TRUNG TÂM LADY FIT'
  const centerShortName = contract.short_name || 'LADY FIT'

  let totalWords = ''
  try { totalWords = numberToVietnameseWords(contract.total_amount) } catch { totalWords = '' }

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Hợp Đồng - ${contract.member_name || ''}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13px;
      line-height: 1.7;
      color: #000;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm 20mm 16mm 20mm;
    }
    h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #b91c1c; text-align: center; }
    h3 { font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 10px; }
    .subtitle { font-size: 12px; font-style: italic; color: #4b5563; text-align: center; margin-top: 4px; }
    .section { margin-bottom: 22px; }
    .ml { margin-left: 16px; }
    .row { margin-bottom: 5px; }
    .label { font-weight: 600; text-decoration: underline; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 5px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 5px; }
    .package-box {
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 10px;
    }
    .small-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9ca3af; }
    .big-val { font-size: 15px; font-weight: 700; }
    .red { color: #b91c1c; }
    .total-price { font-size: 20px; font-weight: 900; color: #b91c1c; }
    .amount-words { font-size: 10px; font-style: italic; color: #6b7280; }
    .divider { border-top: 1px solid #e5e7eb; margin: 10px 0; }
    .clauses { font-size: 11px; line-height: 1.7; text-align: justify; }
    .clauses p { margin-bottom: 6px; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 60px; }
    .sig-name { font-weight: 700; margin-top: 10px; }
    .sig-img { max-height: 60px; object-contain: contain; margin: 0 auto; }
    .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    .indent { text-indent: 2em; text-align: justify; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 14mm 18mm; }
    }
  </style>
</head>
<body>
<div class="page">
  <div style="text-align:center;margin-bottom:32px;">
    <h1>Hợp đồng dịch vụ huấn luyện</h1>
    <div class="subtitle">Số: ${contract.id || '........'}/HĐ-LF</div>
  </div>

  <p class="indent" style="margin-bottom:18px;">Hôm nay, tại phòng tập <strong>${centerShortName}</strong> chúng tôi gồm:</p>

  <div class="section">
    <h3>Bên A: Trung tâm ${centerShortName.toUpperCase()}</h3>
    <div class="ml">
      <div class="row"><span class="label">Đại diện:</span> ${contract.center_representative || '.........................................................'}</div>
      <div class="row"><span class="label">Địa chỉ:</span> ${contract.address || '.........................................................'}</div>
      <div class="row"><span class="label">Số điện thoại:</span> ${contract.center_phone || '................................'}</div>
      <div class="grid2">
        <div><span class="label">Số tài khoản:</span> ${contract.account_number || '................................'}</div>
        <div><span class="label">Ngân hàng:</span> ${contract.bank_name || '................................'}</div>
      </div>
      <div class="row"><span class="label">Chủ tài khoản:</span> ${contract.account_holder || '................................'}</div>
    </div>
  </div>

  <div class="section">
    <h3>Bên B: Hội viên (Khách hàng)</h3>
    <div class="ml">
      <div class="row"><span class="label">Họ và tên:</span> <strong style="text-transform:uppercase">${contract.member_name || ''}</strong></div>
      <div class="grid2">
        <div><span class="label">Ngày sinh:</span> ${formatDate(contract.dob)}</div>
        <div><span class="label">Số CMND/CCCD:</span> ${contract.id_number || '................................'}</div>
      </div>
      <div class="row"><span class="label">Địa chỉ thường trú:</span> ${contract.member_address || '.........................................................'}</div>
      <div class="grid2">
        <div><span class="label">Số điện thoại:</span> ${contract.phone || ''}</div>
        <div><span class="label">Email:</span> ${contract.email || '................................'}</div>
      </div>
      <div class="grid3">
        <div><span class="label">Chiều cao:</span> ${contract.initial_height || '....'} cm</div>
        <div><span class="label">Cân nặng:</span> ${contract.initial_weight || '....'} kg</div>
        <div><span class="label">Bệnh lý:</span> ${contract.medical_condition || 'Không'}</div>
      </div>
      ${(contract.representative_name || contract.representative_phone) ? `
      <div style="margin-top:8px;padding:8px;border:1px dashed #d1d5db;border-radius:6px;">
        <div class="small-label" style="margin-bottom:4px;">Người đại diện theo pháp luật (nếu dưới 18 tuổi)</div>
        <div><span class="label">Họ và tên:</span> ${contract.representative_name || '................................'}</div>
        <div><span class="label">Số ĐT:</span> ${contract.representative_phone || '................................'}</div>
      </div>` : ''}
    </div>
  </div>

  <div class="section">
    <h3>Nội dung gói dịch vụ</h3>
    <div class="package-box">
      <div class="grid2" style="margin-bottom:12px;">
        <div>
          <div class="small-label">Gói tập đăng ký</div>
          <div class="big-val red">${contract.package_name || '--'}</div>
        </div>
        <div>
          <div class="small-label">Số buổi / Cân khoán</div>
          <div class="big-val">${contract.total_sessions || '--'} buổi</div>
        </div>
      </div>
      <div class="grid2" style="margin-bottom:12px;">
        <div>
          <div class="small-label">Ngày bắt đầu</div>
          <div style="font-size:14px;font-weight:600;">${formatDate(contract.start_date)}</div>
        </div>
        <div>
          <div class="small-label">Ngày kết thúc (Dự kiến)</div>
          <div style="font-size:14px;font-weight:600;">${formatDate(contract.end_date)}</div>
        </div>
      </div>
      <div class="grid2" style="margin-bottom:12px;">
        <div>
          <div class="small-label">Huấn luyện viên phụ trách</div>
          <div style="font-size:14px;font-weight:600;">${contract.trainer_name || 'Đang cập nhật'}</div>
        </div>
        <div>
          <div class="small-label">Hình thức HL</div>
          <div style="font-size:14px;font-weight:600;">${contract.trainer_type || 'Trực tiếp'}</div>
        </div>
      </div>
      <div class="divider"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div class="small-label">Tổng giá trị hợp đồng</div>
          <div class="total-price">${formatCurrency(contract.total_amount)}</div>
        </div>
        <div class="amount-words">(Bằng chữ: ${totalWords} đồng chẵn)</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>Các điều khoản chính</h3>
    <div class="clauses">
      <p>1. <strong><em>Thanh toán:</em></strong> Hội viên có trách nhiệm thanh toán đầy đủ giá trị hợp đồng trước khi kích hoạt gói tập. Trường hợp trả góp hoặc cọc, cần tuân thủ đúng lộ trình đã cam kết.</p>
      <p>2. <strong><em>Thời hạn:</em></strong> Gói tập có hiệu lực kể từ ngày ký. Sau thời hạn quy định, nếu Hội viên chưa sử dụng hết số buổi, gói tập sẽ tự động hết hạn trừ khi có thỏa thuận bảo lưu bằng văn bản.</p>
      <p>3. <strong><em>Nội quy:</em></strong> Hội viên cam kết tuân thủ mọi nội quy của phòng tập, mặc trang phục phù hợp và giữ gìn vệ sinh, tài sản chung.</p>
      <p>4. <strong><em>Miễn trừ trách nhiệm:</em></strong> Trung tâm không chịu trách nhiệm về các chấn thương xảy ra do Hội viên không tuân thủ hướng dẫn của HLV hoặc tự ý tập luyện sai cách.</p>
    </div>
  </div>

  <div class="signature-grid">
    <div>
      <div style="font-weight:700;text-transform:uppercase;">Đại diện trung tâm</div>
      <div class="sig-note">(Ký và ghi rõ họ tên)</div>
      <div class="sig-name">${contract.center_representative || '................................'}</div>
    </div>
    <div>
      <div style="font-weight:700;text-transform:uppercase;">Hội viên (Khách hàng)</div>
      <div class="sig-note" style="margin-bottom: 10px;">(Ký và ghi rõ họ tên)</div>
      ${contract.signature_url ? `<img src="${contract.signature_url}" class="sig-img" alt="Customer Signature" />` : '<div style="height:60px;"></div>'}
      <div class="sig-name">${contract.member_name || ''}</div>
    </div>
  </div>

  <div class="footer">© ${new Date().getFullYear()} ${centerName} - Hệ thống quản lý chuyên nghiệp</div>
</div>
</body>
</html>`
}


interface ContractPrintTemplateProps {
  contract: any
}

export const ContractPrintTemplate = React.forwardRef<HTMLDivElement, ContractPrintTemplateProps>(
  ({ contract }, ref) => {
    if (!contract) return null

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '.../.../...'
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi })
    }

    const centerName = contract.facility_name || contract.branches?.name || 'TRUNG TÂM LADY FIT'
    const centerShortName = contract.short_name || 'LADY FIT'

    return (
      <div
        ref={ref}
        className="bg-white p-16 font-serif leading-relaxed text-[13px] w-[210mm] min-h-[297mm] mx-auto shadow-lg print:shadow-none print:m-0"
        style={{ color: '#000000', backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-2xl font-bold uppercase tracking-widest" style={{ color: '#b91c1c' }}>Hợp đồng dịch vụ huấn luyện</h1>
          <p className="text-sm italic" style={{ color: '#4b5563' }}>Số: {contract.id || '........'}/HĐ-LF</p>
        </div>

        <div className="mb-6">
          <p className="indent-8 text-justify">
            Hôm nay, tại phòng tập <span className="font-bold">{centerShortName}</span> chúng tôi gồm:
          </p>
        </div>

        {/* Section 1: Trung tam */}
        <div className="mb-8">
          <h3 className="font-bold uppercase mb-3 border-b pb-1" style={{ borderBottomColor: '#000000' }}>Bên A: TRUNG TÂM {centerShortName.toUpperCase()}</h3>
          <div className="grid grid-cols-1 gap-1.5 ml-4">
            <p><span className="font-semibold underline">Đại diện:</span> {contract.center_representative || '.........................................................'}</p>
            <p><span className="font-semibold underline">Địa chỉ:</span> {contract.address || '.........................................................'}</p>
            <p><span className="font-semibold underline">Số điện thoại:</span> {contract.center_phone || '................................'}</p>
            <div className="grid grid-cols-2 gap-4">
              <p><span className="font-semibold underline">Số tài khoản:</span> {contract.account_number || '................................'}</p>
              <p><span className="font-semibold underline">Ngân hàng:</span> {contract.bank_name || '................................'}</p>
            </div>
            <p><span className="font-semibold underline">Chủ tài khoản:</span> {contract.account_holder || '................................'}</p>
          </div>
        </div>

        {/* Section 2: Hoi vien */}
        <div className="mb-8">
          <h3 className="font-bold uppercase mb-3 border-b pb-1" style={{ borderBottomColor: '#000000' }}>Bên B: HỘI VIÊN (KHÁCH HÀNG)</h3>
          <div className="grid grid-cols-1 gap-1.5 ml-4">
            <p><span className="font-semibold underline">Họ và tên:</span> <span className="font-bold uppercase">{contract.member_name}</span></p>
            <div className="grid grid-cols-2 gap-4">
              <p><span className="font-semibold underline">Ngày sinh:</span> {formatDate(contract.dob)}</p>
              <p><span className="font-semibold underline">Số CMND/CCCD:</span> {contract.id_number || '................................'}</p>
            </div>
            <p><span className="font-semibold underline">Địa chỉ thường trú:</span> {contract.member_address || '.........................................................'}</p>
            <div className="grid grid-cols-2 gap-4">
              <p><span className="font-semibold underline">Số điện thoại:</span> {contract.phone}</p>
              <p><span className="font-semibold underline">Email:</span> {contract.email || '................................'}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <p><span className="font-semibold underline">Chiều cao:</span> {contract.initial_height || '....'} cm</p>
              <p><span className="font-semibold underline">Cân nặng:</span> {contract.initial_weight || '....'} kg</p>
              <p><span className="font-semibold underline">Bệnh lý:</span> {contract.medical_condition || 'Không'}</p>
            </div>
            {(contract.representative_name || contract.representative_phone) && (
              <div className="mt-2 p-2 border border-dashed rounded" style={{ borderColor: '#d1d5db' }}>
                <p className="text-[11px] italic mb-1" style={{ color: '#4b5563' }}>Thông tin người đại diện theo pháp luật (nếu Hội viên dưới 18 tuổi):</p>
                <p><span className="font-semibold underline">Họ và tên:</span> {contract.representative_name || '................................'}</p>
                <p><span className="font-semibold underline">Số ĐT:</span> {contract.representative_phone || '................................'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Goi tap */}
        <div className="mb-8">
          <h3 className="font-bold uppercase mb-3 border-b pb-1" style={{ borderBottomColor: '#000000' }}>Nội dung gói dịch vụ</h3>
          <div className="grid grid-cols-1 gap-3 p-4 border rounded-xl" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Gói tập đăng ký</p>
                <p className="text-[15px] font-bold uppercase" style={{ color: '#b91c1c' }}>{contract.package_name}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Số buổi / Cân khoán</p>
                <p className="text-[15px] font-bold">{contract.total_sessions || '--'} buổi</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Ngày bắt đầu</p>
                <p className="text-[14px] font-semibold">{formatDate(contract.start_date)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Ngày kết thúc (Dự kiến)</p>
                <p className="text-[14px] font-semibold">{formatDate(contract.end_date)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Huấn luyện viên phụ trách</p>
                <p className="text-[14px] font-semibold">{contract.trainer_name || 'Đang cập nhật'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Hình thức HL</p>
                <p className="text-[14px] font-semibold">{contract.trainer_type || 'Trực tiếp'}</p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t" style={{ borderTopColor: '#e5e7eb' }}>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-bold uppercase" style={{ color: '#9ca3af' }}>Tổng giá trị hợp đồng</p>
                  <p className="text-xl font-black" style={{ color: '#b91c1c' }}>{formatCurrency(contract.total_amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] italic" style={{ color: '#6b7280' }}>
                    (Bằng chữ: {numberToVietnameseWords(contract.total_amount)} đồng chẵn)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Dieu khoan quan trong */}
        <div className="mb-8 text-justify">
          <h3 className="font-bold uppercase mb-2">Các điều khoản chính</h3>
          <div className="space-y-2 text-[11px] leading-relaxed">
            <p>1. <span className="font-bold italic">Thanh toán:</span> Hội viên có trách nhiệm thanh toán đầy đủ giá trị hợp đồng trước khi kích hoạt gói tập. Trường hợp trả góp hoặc cọc, cần tuân thủ đúng lộ trình đã cam kết.</p>
            <p>2. <span className="font-bold italic">Thời hạn:</span> Gói tập có hiệu lực kể từ ngày ký. Sau thời hạn quy định, nếu Hội viên chưa sử dụng hết số buổi, gói tập sẽ tự động hết hạn trừ khi có thỏa thuận bảo lưu bằng văn bản.</p>
            <p>3. <span className="font-bold italic">Nội quy:</span> Hội viên cam kết tuân thủ mọi nội quy của phòng tập, mặc trang phục phù hợp và giữ gìn vệ sinh, tài sản chung.</p>
            <p>4. <span className="font-bold italic">Miễn trừ trách nhiệm:</span> Trung tâm không chịu trách nhiệm về các chấn thương xảy ra do Hội viên không tuân thủ hướng dẫn của HLV hoặc tự ý tập luyện sai cách.</p>
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="mt-16 grid grid-cols-2 text-center">
          <div className="space-y-20">
            <div>
              <p className="font-bold uppercase">Đại diện trung tâm</p>
              <p className="text-[10px] italic">(Ký và ghi rõ họ tên)</p>
            </div>
            <p className="font-bold">{contract.center_representative || '................................'}</p>
          </div>
          <div className="space-y-4">
            <div>
              <p className="font-bold uppercase">Hội viên (Khách hàng)</p>
              <p className="text-[10px] italic mb-2">(Ký và ghi rõ họ tên)</p>
              {contract.signature_url ? (
                <div className="flex justify-center">
                  <img src={contract.signature_url} className="h-14 object-contain" alt="Signature" />
                </div>
              ) : (
                <div className="h-14"></div>
              )}
            </div>
            <p className="font-bold">{contract.member_name}</p>
          </div>
        </div>

        <div className="mt-20 text-center text-[10px] border-t pt-2" style={{ color: '#9ca3af', borderTopColor: '#e5e7eb' }}>
          <p>© {new Date().getFullYear()} {centerName} - Hệ thống quản lý chuyên nghiệp</p>
        </div>
      </div>
    )
  }
)

ContractPrintTemplate.displayName = 'ContractPrintTemplate'
