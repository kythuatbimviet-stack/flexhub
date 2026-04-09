'use server'

/**
 * Server action để gửi email hợp đồng
 * - Nếu có RESEND_API_KEY: gửi qua Resend API
 * - Nếu không có: trả về status 'mailto' để client dùng fallback mailto:
 */

export interface SendEmailPayload {
  to: string
  subject: string
  html: string
  contractId?: string
  memberName?: string
  attachments?: {
    filename: string
    content: string | Buffer // Base64 string or Buffer
  }[]
}

import { createAdminClient } from '@/lib/supabase-server'

export interface SendEmailResult {
  success: boolean
  method?: 'resend' | 'mailto'
  mailtoUrl?: string
  error?: string
}

export async function sendContractEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const { to, subject, html, contractId, memberName, attachments } = payload
  const apiKey = process.env.RESEND_API_KEY

  // ── Resend path ────────────────────────────────
  if (apiKey) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      const fromName = process.env.EMAIL_FROM_NAME || 'GymERP'
      const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'no-reply@resend.dev'

      const { error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
        }))
      })

      if (error) {
        return { success: false, method: 'resend', error: error.message }
      }
      return { success: true, method: 'resend' }
    } catch (e: any) {
      return { success: false, method: 'resend', error: e.message || 'Lỗi gửi Resend' }
    }
  }

  // ── Fallback: mailto URL ────────────────────────
  const body = `Kính gửi ${memberName || 'Quý khách'},\n\nVui lòng xem nội dung hợp đồng ${contractId || ''} đã được đính kèm.\n\nTrân trọng,\nGymERP`
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return {
    success: true,
    method: 'mailto',
    mailtoUrl,
  }
}

export interface PaymentConfirmationPayload {
  coso: string
  ten: string
  sdt: string
  email: string
  diachi: string
  ngaysinh: string
  cmnd: string
  nguon: string
  goi: string
  custom: string
  tien1: string
  httt1: string
  tien2?: string
  httt2?: string
  tonggiatri: string
  hlv: string
  nbd: string
  nkt: string
  ndong: string
  nguoithu: string
  ghichu: string
  custom_message?: string
  contractId?: string
}

/**
 * Tạo nội dung HTML cho Biên nhận thanh toán dựa trên thiết kế Eva's Fit
 */
function generatePaymentConfirmationHtml(d: PaymentConfirmationPayload): string {
  const salmon = '#E8896A';
  const salmonDk = '#993C1D';
  const salmonLt = '#FAECE7';
  const salmonBdr = '#F5C4B3';
  const cream = '#FAF8F5';
  const dark = '#1C1A18';
  const gray = '#6B6760';
  const border = '#E8E4DE';
  const white = '#FFFFFF';

  const row = (label: string, value: string | undefined) => {
    const displayValue = value || '—';
    return `
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:${gray};font-weight:600;
                   letter-spacing:0.6px;text-transform:uppercase;white-space:nowrap;
                   border-bottom:1px solid ${border};width:40%">${label}</td>
        <td style="padding:10px 16px;font-size:15px;color:${dark};font-weight:500;
                   border-bottom:1px solid ${border}">${displayValue}</td>
      </tr>`;
  };

  const sectionHeader = (title: string, icon: string) => `
      <tr>
        <td colspan="2" style="background:${salmon};padding:12px 16px;
                                font-size:13px;color:${white};font-weight:600;
                                letter-spacing:0.8px;text-transform:uppercase">
          ${icon} ${title}
        </td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@400;500&display=swap');
  body { margin:0; padding:0; background:#F4F2EF; font-family:'DM Sans',Arial,sans-serif; }
  a { color:${salmon}; }
</style>
</head>
<body>
<div style="max-width:620px;margin:0 auto;padding:32px 16px 48px">

  <!-- ===== HEADER ===== -->
  <div style="text-align:center;margin-bottom:28px">
    <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;
                color:${salmon};letter-spacing:-0.3px;margin-bottom:4px">Eva's Fit</div>
    <div style="font-size:12px;color:${gray};letter-spacing:1px;text-transform:uppercase">
      Xác nhận thanh toán
    </div>
  </div>

  <!-- ===== GREETING ===== -->
  <div style="background:${white};border-radius:14px;padding:24px 28px;
              border:1px solid ${border};margin-bottom:16px">
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:20px;
              color:${dark};margin:0 0 12px">Xin chào ${d.ten}! 👋</p>
    <p style="font-size:14px;color:${gray};line-height:1.7;margin:0">
      Eva's Fit xin xác nhận đã nhận được thanh toán từ bạn.
      Vui lòng kiểm tra thông tin biên nhận bên dưới và lưu trữ để tham khảo khi cần.
    </p>
    ${d.custom_message ? `
    <div style="margin-top:20px; padding:16px; background:${cream}; border-radius:10px; border-left:4px solid ${salmon}; font-style:italic; color:${dark}">
      "${d.custom_message}"
    </div>` : ''}
  </div>

  <!-- ===== MAIN RECEIPT CARD ===== -->
  <div style="background:${white};border-radius:14px;overflow:hidden;
              border:1px solid ${border};margin-bottom:16px">

    <!-- Card header -->
    <div style="background:${salmon};padding:18px 24px;color:${white}">
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:18px;
                  font-weight:600;letter-spacing:0.3px">
        BIÊN NHẬN THANH TOÁN
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:2px">
        Ngày đóng: ${d.ndong} &nbsp;|&nbsp; Cơ sở: ${d.coso}
      </div>
    </div>

    <!-- Member info table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      ${sectionHeader('Thông tin hội viên', '👤')}
      ${row('Tên hội viên', d.ten)}
      ${row('Số điện thoại', d.sdt)}
      ${row('Gmail', d.email)}
      ${row('Ngày sinh', d.ngaysinh)}
      ${row('Địa chỉ', d.diachi)}
      ${row('Số CMND/CCCD', d.cmnd)}
      ${row('Nguồn', d.nguon)}

      ${sectionHeader('Thông tin gói tập', '🏋️')}
      ${row('Gói tập', d.goi)}
      ${row('Lựa chọn', d.custom)}
      ${row('Huấn luyện viên', d.hlv)}
      ${row('Ngày bắt đầu', d.nbd)}
      ${row('Ngày kết thúc', d.nkt)}

      ${sectionHeader('Chi tiết thanh toán', '💳')}
      ${row('Lần 1 — Số tiền', d.tien1 ? d.tien1 + ' đ' : '—')}
      ${row('Lần 1 — Hình thức', d.httt1)}
      ${d.tien2 ? row('Lần 2 — Số tiền', d.tien2 + ' đ') : ''}
      ${d.httt2 ? row('Lần 2 — Hình thức', d.httt2) : ''}
      ${row('Ghi chú', d.ghichu)}
    </table>

    <!-- Total -->
    <div style="background:${salmon};padding:18px 24px;color:${white}">
      <table width="100%">
        <tr>
          <td style="font-size:13px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">
            Tổng giá trị hợp đồng
          </td>
          <td style="font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:600;text-align:right">
            ${d.tonggiatri} đ
          </td>
        </tr>
      </table>
    </div>

    <!-- Người thu -->
    <div style="padding:14px 24px;background:${cream};
                font-size:13px;color:${gray};text-align:right">
      Người thu: <strong style="color:${dark}">${d.nguoithu}</strong>
    </div>

  </div>

  <!-- ===== LƯU Ý CARD ===== -->
  <div style="background:${white};border-radius:14px;border:1.5px solid ${salmonBdr};
              padding:22px 24px;margin-bottom:16px">
    <div style="font-size:12px;color:${salmonDk};font-weight:700;
                letter-spacing:0.9px;text-transform:uppercase;margin-bottom:14px">
      LƯU Ý QUAN TRỌNG
    </div>
    <p style="font-size:13.5px;color:${gray};line-height:1.75;margin:0 0 10px">
      Tất cả các khoản thu đều <strong>không hoàn lại</strong>.
    </p>
    <p style="font-size:13.5px;color:${gray};line-height:1.75;margin:0">
      Các khoản đặt cọc có giá trị sử dụng trong vòng <strong>14 ngày</strong> kể từ ngày thanh toán.
    </p>
  </div>

  <!-- ===== FOOTER ===== -->
  <div style="text-align:center;padding-top:20px;border-top:1px solid ${border}">
    <div style="font-family:'Playfair Display',Georgia,serif;font-size:16px;
                color:${salmon};margin-bottom:6px">Eva's Fit</div>
    <div style="font-size:12px;color:${gray};line-height:1.8">
      ${d.coso}<br>
      Email: evasfit@gmail.com
    </div>
  </div>

</div>
</body>
</html>`;
}

/**
 * [SEC] Validate webhook URL to prevent SSRF — allow only HTTPS to non-private addresses
 */
function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Must be HTTPS
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    // Block local/private/internal addresses
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.16.') ||
      host.startsWith('172.17.') ||
      host.startsWith('172.18.') ||
      host.startsWith('172.19.') ||
      host.startsWith('172.20.') ||
      host.startsWith('172.21.') ||
      host.startsWith('172.22.') ||
      host.startsWith('172.23.') ||
      host.startsWith('172.24.') ||
      host.startsWith('172.25.') ||
      host.startsWith('172.26.') ||
      host.startsWith('172.27.') ||
      host.startsWith('172.28.') ||
      host.startsWith('172.29.') ||
      host.startsWith('172.30.') ||
      host.startsWith('172.31.') ||
      host.startsWith('169.254.')
    ) return false
    return true
  } catch {
    return false
  }
}

/**
 * Định dạng dữ liệu biên nhận thành văn bản thuần (text) để truyền vào tham số email_message của Webhook
 */
function formatReceiptToText(d: PaymentConfirmationPayload): string {
  const lines = [
    `BIÊN NHẬN THANH TOÁN (PAYMENT RECEIPT)`,
    `Hội viên: ${d.ten}`,
    `Số điện thoại: ${d.sdt}`,
    `Ngày đóng: ${d.ndong}`,
    `Cơ sở: ${d.coso}`,
    `----------------`,
    `THÔNG TIN GÓI TẬP:`,
    `Gói tập: ${d.goi}`,
    `Lựa chọn: ${d.custom || '—'}`,
    `Huấn luyện viên: ${d.hlv || '—'}`,
    `Thời hạn: ${d.nbd} - ${d.nkt}`,
    `----------------`,
    `CHI TIẾT THANH TOÁN:`,
    `Lần 1: ${d.tien1} đ (${d.httt1})`,
  ];

  if (d.tien2) {
    lines.push(`Lần 2: ${d.tien2} đ (${d.httt2 || '—'})`);
  }

  lines.push(`Tổng giá trị: ${d.tonggiatri} đ`);
  lines.push(`\nGhi chú: ${d.ghichu || '—'}`);
  lines.push(`----------------`);

  if (d.custom_message) {
    lines.push(`\nLời nhắn gửi kèm: "${d.custom_message}"`);
  }

  return lines.join('\n');
}

export async function sendPaymentConfirmationAction(payload: PaymentConfirmationPayload): Promise<SendEmailResult> {
  try {
    if (!payload.contractId) {
      throw new Error('Thiếu ID hợp đồng (Contract ID) để gửi biên nhận')
    }

    const supabase = await createAdminClient()

    // 1. Lấy thông tin URL Webhook của chi nhánh (để gửi trực tiếp)
    const { data: contract, error: fetchErr } = await supabase
      .from('contracts')
      .select('id, branch_id, branches(url_guimail)')
      .eq('id', payload.contractId)
      .maybeSingle()

    if (fetchErr || !contract) {
      throw new Error('Không tìm thấy thông tin hợp đồng để lấy webhook chi nhánh')
    }

    const branchWebhook = (contract.branches as any)?.url_guimail
    
    // 2. Định dạng nội dung (HTML cho Email, Text cho log/fallback)
    const receiptHtml = generatePaymentConfirmationHtml(payload)
    const receiptText = formatReceiptToText(payload)

    // 3. THỰC HIỆN GỬI TRỰC TIẾP (GIỐNG LOGIC HỢP ĐỒNG)
    if (branchWebhook && isValidWebhookUrl(branchWebhook)) {
      const subject = `Xác nhận thanh toán - ${payload.ten} - Eva's Fit`
      
      const gasPayload = {
        "email": payload.email, // LẤY TRỰC TIẾP TỪ DIALOG
        "name": payload.ten,
        "subject": subject,
        "message": receiptHtml // GỬI FULL HTML ĐỂ CÓ GIAO DIỆN ĐẸP
      }

      const response = await fetch(branchWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gasPayload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Lỗi từ GAS Webhook (${response.status}):`, errorText)
        // Dù lỗi gửi mail vẫn tiếp tục cập nhật DB nhưng báo lỗi cho User biết
      }
    } else {
      console.warn('Chi nhánh chưa cấu hình url_guimail hoặc URL không hợp lệ. Không thể gửi email trực tiếp.')
    }

    // 4. Cập nhật trạng thái vào Database (Chỉ để lưu vết, không dùng trigger GAS nữa)
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        email_message: receiptText,            // Lưu bản text vào DB để xem lại
        is_receipt_sent: true,                 // Đánh dấu đã gửi
        receipt_sent_at: new Date().toISOString(), 
        payment_method: payload.httt1,
        payment_notes: payload.ghichu,
        sendemail_xntt: 'done'                 // Đánh dấu 'done' luôn để không kích hoạt Nhánh 3 cũ nữa
      })
      .eq('id', payload.contractId)

    if (updateError) {
      console.error('Lỗi khi cập nhật trạng thái biên nhận vào DB:', updateError.message)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Gửi biên nhận thanh toán lỗi:', error)
    return { success: false, error: error.message }
  }
}






