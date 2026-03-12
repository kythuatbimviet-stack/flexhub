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
}

export interface SendEmailResult {
    success: boolean
    method?: 'resend' | 'mailto'
    mailtoUrl?: string
    error?: string
}

export async function sendContractEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
    const { to, subject, html, contractId, memberName } = payload
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
