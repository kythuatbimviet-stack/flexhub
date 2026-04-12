'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getAccessControl, UserProfile } from '@/lib/permissions'
import { cache } from 'react'

const getAccessFilter = cache(async () => {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return null

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

    if (!profile) return null
    return { 
        user: profile as UserProfile, 
        authId: authUser.id,
        access: getAccessControl(profile as UserProfile) 
    }
})

/**
 * Lấy lịch sử gửi XNTT
 */
export async function fetchXnttHistory() {
    const supabase = await createClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // Đồng bộ quyền với phần Thu (Revenue)
        if (accessInfo.access.isStaffOnly) {
            return { success: true, data: [] }
        }

        const { data, error } = await supabase
            .from('xntt_history')
            .select(`
                *,
                clients (member_name)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Gửi lại XNTT (Tạo bản ghi mới để kích hoạt Webhook)
 */
export async function resendXnttAction(historyId: string) {
    const supabase = await createAdminClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // 1. Lấy dữ liệu cũ
        const { data: oldLog, error: fetchError } = await supabase
            .from('xntt_history')
            .select('*')
            .eq('id', historyId)
            .single()

        if (fetchError || !oldLog) throw new Error('Không tìm thấy bản ghi cũ')

        // 2. Insert bản ghi mới (sẽ kích hoạt Webhook INSERT trên GAS)
        // Chúng ta xóa ID để Supabase tự sinh ID mới, set status về pending
        const { data: newLog, error: insertError } = await supabase
            .from('xntt_history')
            .insert([{
                contract_id: oldLog.contract_id,
                client_id: oldLog.client_id,
                revenue_id: oldLog.revenue_id,
                email: oldLog.email,
                subject: oldLog.subject,
                html_body: oldLog.html_body,
                amount: oldLog.amount,
                payment_method: oldLog.payment_method,
                send_payload: oldLog.send_payload, // Payload cũ vẫn dùng được vì cấu trúc giống nhau
                status: 'pending',
                created_by_email: accessInfo.user.email
            }])
            .select()
            .single()

        if (insertError) throw insertError

        // 3. Cập nhật lại send_payload của bản ghi mới để chứa ID mới (cho GAS update status đúng dòng)
        const payloadObj = JSON.parse(oldLog.send_payload)
        payloadObj.id = newLog.id 
        
        await supabase
            .from('xntt_history')
            .update({ send_payload: JSON.stringify(payloadObj) })
            .eq('id', newLog.id)

        revalidatePath('/xntt-history')
        return { success: true, data: newLog }
    } catch (error: any) {
        console.error('Resend XNTT Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Xóa bản ghi lịch sử (Nếu cần)
 */
export async function deleteXnttHistory(id: string) {
    const supabase = await createAdminClient()
    try {
        const { error } = await supabase.from('xntt_history').delete().eq('id', id)
        if (error) throw error
        revalidatePath('/xntt-history')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
