'use server'

import { createClient, createAdminClient, createClient as createSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { numberToVietnameseWords } from '@/lib/utils'
import { getAccessControl, UserProfile } from '@/lib/permissions'

async function getAccessFilter() {
    const supabase = await createSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return null

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single()

    if (!profile) return null
    return { user: profile as UserProfile, access: getAccessControl(profile as UserProfile) }
}

// Tự động tính các trường "bằng chữ" từ số tiền và ép kiểu số cho các trường numeric
function computeAmountTextFields(data: any): any {
    const enriched = { ...data }
    
    // Các trường cần ép kiểu số
    const numericFields = [
        'package_price', 'discounted_price', 'total_amount', 'price_before_discount',
        'initial_height', 'initial_weight', 'target_weight', 'final_weight', 'weight_change',
        'quantity', 'package_duration', 'total_sessions', 'payment_installment', 'total_days'
    ]

    numericFields.forEach(field => {
        if (enriched[field] !== undefined && enriched[field] !== null && enriched[field] !== '') {
            const val = Number(enriched[field])
            enriched[field] = isNaN(val) ? null : val
        } else if (enriched[field] === '') {
            enriched[field] = null
        }
    })

    // Đặc biệt cho account_number (có thể là bigint)
    if (enriched.account_number !== undefined && enriched.account_number !== null && enriched.account_number !== '') {
        const accNum = enriched.account_number.toString().replace(/\D/g, '')
        enriched.account_number = accNum ? accNum : null
    }

    try {
        if (enriched.total_amount != null && enriched.total_amount !== '') {
            const amount = Number(enriched.total_amount)
            if (!isNaN(amount) && amount > 0) {
                enriched.total_amount_text = numberToVietnameseWords(amount) + ' đồng chẵn'
            }
        }
        if (enriched.package_price != null && enriched.package_price !== '') {
            const amount = Number(enriched.package_price)
            if (!isNaN(amount) && amount > 0) {
                enriched.package_price_text = numberToVietnameseWords(amount) + ' đồng chẵn'
            }
        }
        if (enriched.discounted_price != null && enriched.discounted_price !== '') {
            const amount = Number(enriched.discounted_price)
            if (!isNaN(amount) && amount > 0) {
                enriched.discounted_price_text = numberToVietnameseWords(amount) + ' đồng chẵn'
            }
        }
    } catch (e) {
        // silent fail
    }

    // Loại bỏ các object từ câu lệnh join nếu có (Supabase sẽ báo lỗi nếu insert/update cả các object này)
    delete enriched.clients
    delete enriched.branches
    delete enriched.memberships

    return enriched
}

export async function fetchContracts() {
    const supabase = await createClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let query = supabase
            .from('contracts')
            .select(`
                *,
                clients (member_name, phone),
                branches (name)
            `)
            .order('created_at', { ascending: false })

        // Apply RBAC filters
        if (accessInfo.access.isStaffOnly) {
            query = query.or(`created_by_email.eq.${accessInfo.user.email},assigned_pt.eq.${accessInfo.user.email},trainer_name.ilike.%${accessInfo.user.name}%`)
        } else if (!accessInfo.access.canViewAllBranches) {
            query = query.or(`branch_id.eq.${accessInfo.user.branch_id},created_by_email.eq.${accessInfo.user.email}`)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function fetchContractById(id: string) {
    const supabase = await createAdminClient()
    try {
        const { data, error } = await supabase
            .from('contracts')
            .select(`
                *,
                clients (member_name, phone, email, dob, address),
                branches (name, id, legal_representative, representative_phone, center_address, center_phone)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createContract(contract: any) {
    const supabase = await createClient()
    try {
        const accessInfo = await getAccessFilter()
        if (accessInfo) {
            contract.created_by_email = accessInfo.user.email
        }

        const enriched = computeAmountTextFields(contract)
        
        const { data, error } = await supabase
            .from('contracts')
            .insert([enriched])
            .select()
            .single()

        if (error) throw error

        revalidatePath('/contracts')
        return { success: true, data }
    } catch (error: any) {
        console.error('Create Contract Error:', error)
        return { success: false, error: error.message }
    }
}

export async function finalizeContract(id: string, finalizeData: any) {
    const supabase = await createClient()
    try {
        const { contractUpdates, debtPlan } = finalizeData

        // 1. Cập nhật hợp đồng (Trạng thái, ngày ký, ngày bắt đầu/kết thúc)
        const { data: contractData, error: contractError } = await supabase
            .from('contracts')
            .update({
                ...contractUpdates,
                status: 'Đã ký HĐ'
            })
            .eq('id', id)
            .select()
            .single()

        if (contractError) throw contractError

        // 2. Nếu có trả trước, tạo khoản thu (Revenue)
        if (debtPlan && Number(debtPlan.paid_upfront) > 0) {
            const { error: revError } = await supabase
                .from('revenue')
                .insert([{
                    amount: debtPlan.paid_upfront,
                    customer_id: contractData.client_id,
                    branch_id: contractData.branch_id,
                    contract_id: contractData.id,
                    category_id: 'Hợp đồng',
                    payment_method: contractUpdates.payment_method || 'Tiền mặt',
                    description: `Thu tiền trả trước cho HĐ ${contractData.id}`,
                    recorded_at: contractUpdates.signing_date || new Date().toISOString().split('T')[0]
                }])

            if (revError) console.error('Error creating upfront revenue:', revError)
        }

        // 3. Nếu có nợ, tạo hồ sơ nợ (Debt) và các kỳ (Installments)
        if (debtPlan && debtPlan.has_debt) {
            const { data: debtData, error: debtError } = await supabase
                .from('debts')
                .insert([{
                    contract_id: contractData.id,
                    client_id: contractData.client_id,
                    total_amount: contractData.total_amount,
                    paid_amount: debtPlan.paid_upfront,
                    remaining_amount: Number(contractData.total_amount) - Number(debtPlan.paid_upfront),
                    status: 'Thanh toán một phần',
                    branch_id: contractData.branch_id,
                    note: `Tự động tạo khi chốt ký HĐ ${contractData.id}`
                }])
                .select()
                .single()

            if (debtError) throw debtError

            if (debtPlan.installments && debtPlan.installments.length > 0) {
                const { error: instError } = await supabase
                    .from('debt_installments')
                    .insert(debtPlan.installments.map((inst: any) => ({
                        ...inst,
                        debt_id: debtData.id
                    })))

                if (instError) throw instError
            }
        }

        revalidatePath('/contracts')
        revalidatePath('/debts')
        revalidatePath('/financial/revenue')
        revalidatePath('/')
        return { success: true, data: contractData }
    } catch (error: any) {
        console.error('Finalize Contract Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateContract(id: string, updates: any) {
    const supabase = await createClient()
    try {
        const enriched = computeAmountTextFields(updates)
        const { data, error } = await supabase
            .from('contracts')
            .update(enriched)
            .eq('id', id)
            .select()

        if (error) throw error
        revalidatePath('/contracts')
        revalidatePath('/')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteContract(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/contracts')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteContracts(ids: string[]) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .in('id', ids)

        if (error) throw error
        revalidatePath('/contracts')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function importContracts(contracts: any[]) {
    const supabase = await createClient()
    try {
        const enriched = contracts.map(c => computeAmountTextFields(c))
        const { data, error } = await supabase
            .from('contracts')
            .insert(enriched)
            .select()

        if (error) throw error
        revalidatePath('/contracts')
        revalidatePath('/')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
export async function generateContractId(branchId?: string | null) {
    try {
        const adminClient = await createAdminClient()
        const now = new Date()
        const year = now.getFullYear().toString().slice(-2)
        const month = String(now.getMonth() + 1).padStart(2, '0')

        let branchCode = '00'
        if (branchId) {
            branchCode = String(branchId).toUpperCase()
        } else {
            const { data: { user: authUser } } = await adminClient.auth.getUser()
            if (authUser?.email) {
                const { data: userProfile } = await adminClient
                    .from('users')
                    .select('branch_id')
                    .eq('email', authUser.email)
                    .single()
                if (userProfile?.branch_id) {
                    branchCode = String(userProfile.branch_id).toUpperCase()
                }
            }
        }

        const prefix = `HD-${branchCode}-${year}${month}`
        const { data: existing } = await adminClient
            .from('contracts')
            .select('id')
            .like('id', `${prefix}%`)

        const seq = String((existing?.length ?? 0) + 1).padStart(3, '0')
        const newId = `${prefix}${seq}`

        return { success: true, data: newId }
    } catch (error: any) {
        console.error('Generate Contract ID Error:', error)
        return { success: false, error: error.message }
    }
}

export async function shareContractViaZalo(id: string, message?: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('contracts')
            .update({ 
                sendzalo: new Date().toISOString(),
                zalo_message: message || null
            })
            .eq('id', id)

        if (error) throw error
        return { success: true }
    } catch (error: any) {
        console.error('Share Zalo Error:', error)
        return { success: false, error: error.message }
    }
}

export async function shareContractViaEmail(id: string, message?: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('contracts')
            .update({ 
                sendemail: new Date().toISOString(),
                // We'll pass the message so GAS can see it in the record
                email_message: message || null
            })
            .eq('id', id)

        if (error) throw error
        return { success: true }
    } catch (error: any) {
        console.error('Share Email Error:', error)
        return { success: false, error: error.message }
    }
}

export async function sendCustomContractEmail(id: string, to: string, subject: string, body: string) {
    const supabase = await createAdminClient()
    try {
        // 1. Fetch contract data including branch webhook
        const { data: contract, error: fetchError } = await supabase
            .from('contracts')
            .select('*, clients(member_name, email), branches(name, url_guimail)')
            .eq('id', id)
            .single()

        if (fetchError || !contract) throw fetchError || new Error('Không tìm thấy hợp đồng')

        // 2. Identify PDF file ID
        const fileUrl = contract.contract_file_url
        if (!fileUrl || fileUrl === 'create_contract') {
            throw new Error('Hợp đồng chưa sẵn sàng (PDF chưa được tạo)')
        }

        const match = fileUrl.match(/[-\w]{25,}/)
        const fileId = match ? match[0] : null
        if (!fileId) throw new Error('Không tìm thấy ID file Google Drive')

        const { getGoogleDriveFileContent } = await import('@/lib/google-drive')
        const pdfBuffer = await getGoogleDriveFileContent(fileId)

        // 3. Choose sending method: Branch Webhook or System Email
        const branchWebhook = (contract.branches as any)?.url_guimail

        if (branchWebhook && branchWebhook.startsWith('http')) {
            // --- BRANCH WEBHOOK PATH ---
            const fileName = `HD_${id}_${contract.clients?.member_name || 'KhachHang'}.pdf`
            const pdfBase64 = pdfBuffer.toString('base64')

            const payload = {
                "email": to,
                "name": contract.clients?.member_name || 'Quý khách',
                "fileName": fileName,
                "pdfBase64": pdfBase64,
                "subject": subject, // Adding subject and message as well in case the webhook supports them
                "message": body
            }

            const response = await fetch(branchWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Lỗi từ Webhook chi nhánh (${response.status}): ${errorText}`)
            }

            const result = await response.json()
            if (result.success === false) {
                throw new Error(result.error || 'Webhook chi nhánh trả về lỗi')
            }

            // Update status in DB
            await supabase
                .from('contracts')
                .update({ sendemail: new Date().toISOString() })
                .eq('id', id)

            return { success: true, method: 'branch_webhook' }
        }

        // --- SYSTEM EMAIL PATH (Existing Logic) ---
        const html = body.replace(/\n/g, '<br/>')
        const { sendContractEmail } = await import('./send-email')

        let attachments: any[] = []
        if (process.env.RESEND_API_KEY) {
            attachments = [{
                filename: `HD_${id}_${contract.clients?.member_name || 'KhachHang'}.pdf`,
                content: pdfBuffer
            }]
        }

        const res = await sendContractEmail({
            to,
            subject,
            html,
            attachments,
            memberName: contract.clients?.member_name,
            contractId: id
        })

        if (res.success && res.method === 'resend') {
            await supabase
                .from('contracts')
                .update({ sendemail: new Date().toISOString() })
                .eq('id', id)
        }

        return res
    } catch (error: any) {
        console.error('Send Custom Contract Email Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchLatestContractByClientId(clientId: string) {
    const supabase = await createAdminClient()
    try {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return { success: true, data: null }
            throw error
        }
        return { success: true, data }
    } catch (error: any) {
        console.error('Fetch Latest Contract Error:', error)
        return { success: false, error: error.message }
    }
}
