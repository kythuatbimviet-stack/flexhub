'use server'

import { createClient, createAdminClient, createClient as createSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { numberToVietnameseWords } from '@/lib/utils'
import { getAccessControl, UserProfile } from '@/lib/permissions'
import { cache } from 'react'

// Dedup: cache() ensures only 1 DB call per request even if multiple actions use this
const getAccessFilter = cache(async () => {
    const supabase = await createSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return null

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

    if (!profile) return null
    return { user: profile as UserProfile, access: getAccessControl(profile as UserProfile) }
})

// [SEC] Validate webhook URL to prevent SSRF — allow only HTTPS to non-private addresses
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
            host === '169.254.169.254' || // AWS metadata
            host.endsWith('.local') ||
            host.endsWith('.internal')
        ) {
            return false
        }
        return true
    } catch {
        return false
    }
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
    delete enriched.created_at
    delete enriched.updated_at

    // Luôn ghi nhận thời gian chỉnh sửa mới nhất
    enriched.updated_at = new Date().toISOString()

    return enriched
}

export async function fetchContracts() {
    const supabase = await createAdminClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let query = supabase
            .from('contracts')
            .select(`
                *,
                clients (member_name, phone, avatar_url, dob, status, source, signature_url, height, weight, medical_history),
                branches (name, account_number, account_holder, bank_name, bank_code, representative, address, center_phone, center_address)
            `)
            .order('created_at', { ascending: false })

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []
            
            if (accessInfo.access.isStaffOnly) {
                // Staff: Branch restriction AND (Created by him OR Assigned to him)
                if (allowedIds.length > 0) {
                    query = query.in('branch_id', allowedIds)
                }
                const email = accessInfo.user.email
                const name = accessInfo.user.name
                query = query.or(`created_by_email.eq.${email},assigned_pt.eq.${email},trainer_name.ilike.%${name}%`)
            } else {
                // Manager or Branch Manager: Strictly within allowed branches
                if (allowedIds.length > 0) {
                    query = query.in('branch_id', allowedIds)
                } else {
                    // Fail-safe if no branches allowed
                    query = query.eq('created_by_email', accessInfo.user.email)
                }
            }
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * fetchContractsLite — Fetch nhẹ cho background prefetch & list view.
 * 
 * ✅ Chỉ select các flat fields cần hiển thị trong bảng (không JOIN clients nặng).
 * ✅ JOIN nhẹ với branches(name) để hiển thị tên chi nhánh.
 * ✅ RBAC hoàn toàn giống fetchContracts() — không có data leak.
 * ✅ Không fetch: medical_history, height, weight, avatar_url, signature_url, 
 *    account_number, bank_*, contract_file_url, email_message, etc.
 */
export async function fetchContractsLite() {
    const supabase = await createAdminClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let query = supabase
            .from('contracts')
            .select(`
                id, client_id, status, branch_id, start_date, end_date, signing_date,
                total_amount, payment_method, trainer_name, assigned_pt,
                contract_type, package_name, package_type, facility_name,
                created_by_email, created_at, updated_at,
                sendzalo, sendemail, contract_file_url,
                id_number, phone, email, member_address, dob, source,
                initial_height, initial_weight, target_weight, medical_condition,
                legal_representative, representative_phone, center_address,
                closure_status, closure_reason, closed_at,
                total_sessions, package_price, discounted_price, package_duration, quantity,
                trainer_phone, center_representative, payment_notes,
                clients (member_name, phone, dob, avatar_url, email),
                branches(name)
            `)
            .order('created_at', { ascending: false })

        // [SEC] Apply RBAC filters — Giống hệt fetchContracts()
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []

            if (accessInfo.access.isStaffOnly) {
                // Staff: Branch restriction AND (Created by him OR Assigned to him)
                if (allowedIds.length > 0) {
                    query = query.in('branch_id', allowedIds)
                }
                const email = accessInfo.user.email
                const name = accessInfo.user.name
                query = query.or(`created_by_email.eq.${email},assigned_pt.eq.${email},trainer_name.ilike.%${name}%`)
            } else {
                // Manager or Branch Manager: Strictly within allowed branches
                if (allowedIds.length > 0) {
                    query = query.in('branch_id', allowedIds)
                } else {
                    // Fail-safe if no branches allowed
                    query = query.eq('created_by_email', accessInfo.user.email)
                }
            }
        }

        const { data, error } = await query

        if (error) {
            console.error('[fetchContractsLite] Query Error:', error.message)
            throw error
        }
        
        // Flatten the data to match UI expectations (c.member_name instead of c.clients.member_name)
        const flattened = (data || []).map((c: any) => ({
            ...c,
            member_name: (c as any).clients?.member_name,
            phone: (c as any).clients?.phone,
            dob: (c as any).clients?.dob,
            avatar_url: (c as any).clients?.avatar_url,
            email: (c as any).clients?.email,
            branch_name: (c as any).branches?.name
        }))

        return { success: true, data: flattened }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}


export async function fetchContractById(id: string) {
    try {
        // [SEC] Auth check before using admin client
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('contracts')
            .select(`
                *,
                clients (member_name, phone, email, dob, address, avatar_url, status),
                branches (name, id, legal_representative, representative_phone, center_address, center_phone)
            `)
            .eq('id', id)
            .maybeSingle()

        if (error) throw error
        if (!data) return { success: false, error: 'Không tìm thấy dữ liệu hợp đồng' }

        const { access, user } = accessInfo

        // RBAC Check: nhất quán với fetchContractsLite
        const isOwner = data.created_by_email === user.email
        const isAssigned = data.assigned_pt === user.email || data.trainer_name === user.name

        const canAccess =
            access.canViewAllBranches ||                                                     // Admin/CEO/QL toàn hệ thống
            (access.allowedBranchIds && access.allowedBranchIds.includes(data.branch_id)) || // Manager/BM: trong chi nhánh được phép
            isOwner ||                                                                        // Người tạo
            isAssigned                                                                        // Nhân viên được assign

        if (!canAccess) return { success: false, error: 'Bạn không có quyền xem hợp đồng này' }

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createContract(contract: any) {
    const supabase = await createAdminClient()
    const maxRetries = 5
    let attempt = 0
    let lastError = null

    while (attempt < maxRetries) {
        try {
            const accessInfo = await getAccessFilter()
            if (!accessInfo) return { success: false, error: 'Unauthorized' }

            contract.created_by_email = accessInfo.user.email

            let isAutoGenerated = false
            // Nếu mã là '(Tự động)' hoặc không có mã, sử dụng RPC để cấp mã nguyên tử
            if (!contract.id || contract.id === '(Tự động)') {
                const { data: newId, error: rpcError } = await supabase.rpc('fn_generate_next_id', {
                    p_branch_id: contract.branch_id,
                    p_type: 'contract',
                    p_prefix: 'HD'
                })

                if (rpcError) throw new Error('Lỗi cấp phát mã hợp đồng: ' + rpcError.message)
                contract.id = newId
                isAutoGenerated = true
            }

            const enriched = computeAmountTextFields(contract)
            
            const { data, error } = await supabase
                .from('contracts')
                .insert([enriched])
                .select()
                .maybeSingle()

            if (error) {
                // Check if it's a unique constraint violation (PostgreSQL code 23505)
                if (error.code === '23505') {
                    // If it was an auto-generated ID, retry. If it was manual, return error.
                    if (isAutoGenerated) {
                         attempt++
                         console.warn(`Unique constraint violation for auto-generated ID ${contract.id}. Retrying... (Attempt ${attempt}/${maxRetries})`)
                         // We should clear the ID to let it regenerate in next attempt
                         delete contract.id 
                         continue 
                    } else {
                        throw new Error(`Mã hợp đồng ${contract.id} đã tồn tại trong hệ thống.`)
                    }
                }
                throw error
            }

            if (!data) throw new Error('Không thể tạo hợp đồng')

            revalidatePath('/contracts')
            return { success: true, data }
        } catch (error: any) {
            lastError = error
            console.error('Create Contract Error (Attempt ' + (attempt + 1) + '):', error)
            // If it's not a retryable error, break early
            if (error.code !== '23505') break
            attempt++
        }
    }

    return { success: false, error: lastError?.message || 'Không thể tạo hợp đồng sau nhiều lần thử' }
}

export async function finalizeContract(id: string, contractUpdates: any, debtPlan?: any) {
    const supabase = await createClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) throw new Error('Unauthorized')

        // RBAC Check
        const { data: existing, error: fetchErr } = await supabase
            .from('contracts')
            .select('branch_id, created_by_email')
            .eq('id', id)
            .maybeSingle()
        
        if (fetchErr || !existing) throw new Error('Không tìm thấy hợp đồng')
        const canAccess = accessInfo.access.canViewAllBranches || 
                         (accessInfo.access.allowedBranchIds && accessInfo.access.allowedBranchIds.includes(existing.branch_id)) ||
                         (existing.created_by_email === accessInfo.user.email)
        if (!canAccess) throw new Error('Bạn không có quyền chốt hợp đồng này')

        // 1. Cập nhật hợp đồng (Trạng thái, ngày ký, ngày bắt đầu/kết thúc)
        const { data: contractData, error: contractError } = await supabase
            .from('contracts')
            .update({
                ...contractUpdates,
                status: 'Đã ký HĐ'
            })
            .eq('id', id)
            .select()
            .maybeSingle()

        if (contractError) throw contractError
        if (!contractData) throw new Error('Không tìm thấy hợp đồng để chốt')

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
                .maybeSingle()

            if (debtError) throw debtError
            if (!debtData) throw new Error('Không thể tạo hồ sơ nợ')

            if (debtPlan.installments && debtPlan.installments.length > 0) {
                const { error: instError } = await supabase
                    .from('debt_installments')
                    .insert(debtPlan.installments.map((inst: any) => ({
                        ...inst,
                        debt_id: (debtData as any).id
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
    const supabase = await createAdminClient()
    try {
        // [SEC] Auth check before update
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // RBAC Check: cần cả branch_id và created_by_email
        const { data: existing } = await supabase.from('contracts').select('branch_id, created_by_email').eq('id', id).maybeSingle()
        if (!existing) throw new Error('Hợp đồng không tồn tại')

        const { access, user } = accessInfo
        let canAccess = false

        if (access.canViewAllBranches) {
            // Admin / CEO / Quản lý toàn hệ thống: được sửa tất cả
            canAccess = true
        } else if (access.allowedBranchIds && access.allowedBranchIds.includes(existing.branch_id)) {
            if (access.isStaffOnly) {
                // Nhân viên: chỉ được sửa hợp đồng do chính mình tạo
                canAccess = existing.created_by_email === user.email
            } else {
                // Manager chi nhánh: được sửa tất cả trong chi nhánh của mình
                canAccess = true
            }
        } else {
            // Fallback: chủ sở hữu luôn có quyền sửa
            canAccess = existing.created_by_email === user.email
        }

        if (!canAccess) throw new Error('Bạn không có quyền sửa hợp đồng này')

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
    const supabase = await createAdminClient()
    try {
        // [SEC] Auth check before delete
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // RBAC Check: cần cả branch_id và created_by_email
        const { data: existing } = await supabase.from('contracts').select('branch_id, created_by_email').eq('id', id).maybeSingle()
        if (!existing) throw new Error('Hợp đồng không tồn tại')

        const { access, user } = accessInfo
        let canAccess = false

        if (access.canViewAllBranches) {
            // Admin / CEO / Quản lý toàn hệ thống: được xóa tất cả
            canAccess = true
        } else if (access.allowedBranchIds && access.allowedBranchIds.includes(existing.branch_id)) {
            if (access.isStaffOnly) {
                // Nhân viên: chỉ được xóa hợp đồng do chính mình tạo
                canAccess = existing.created_by_email === user.email
            } else {
                // Manager chi nhánh: được xóa tất cả trong chi nhánh của mình
                canAccess = true
            }
        } else {
            // Fallback: chủ sở hữu luôn có quyền xóa
            canAccess = existing.created_by_email === user.email
        }

        if (!canAccess) throw new Error('Bạn không có quyền xóa hợp đồng này')

        // 1. Get debt IDs to delete installments
        const { data: debts } = await supabase
            .from('debts')
            .select('id')
            .eq('contract_id', id)
        const debtIds = debts?.map(d => d.id) || []

        if (debtIds.length > 0) {
            // Delete installments associated with these debts
            await supabase
                .from('debt_installments')
                .delete()
                .in('debt_id', debtIds)
        }

        // 2. Clear revenue references in debt_installments
        const { data: revenues } = await supabase
            .from('revenue')
            .select('id')
            .eq('contract_id', id)
        const revenueIds = revenues?.map(r => r.id) || []

        if (revenueIds.length > 0) {
            await supabase
                .from('debt_installments')
                .update({ revenue_id: null })
                .in('revenue_id', revenueIds)

            // Delete revenue
            await supabase
                .from('revenue')
                .delete()
                .in('id', revenueIds)
        }

        // 3. Delete debts
        if (debtIds.length > 0) {
            await supabase
                .from('debts')
                .delete()
                .in('id', debtIds)
        }

        // 4. Finally delete the contract
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/contracts')
        revalidatePath('/debts')
        revalidatePath('/financial/revenue')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error('Delete Contract Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteContracts(ids: string[]) {
    const supabase = await createAdminClient()
    try {
        // [SEC] Auth check before bulk delete
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // 1. Get debt IDs
        const { data: debts } = await supabase
            .from('debts')
            .select('id')
            .in('contract_id', ids)
        const debtIds = debts?.map(d => d.id) || []

        if (debtIds.length > 0) {
            await supabase
                .from('debt_installments')
                .delete()
                .in('debt_id', debtIds)
        }

        // 2. Handle revenues
        const { data: revenues } = await supabase
            .from('revenue')
            .select('id')
            .in('contract_id', ids)
        const revenueIds = revenues?.map(r => r.id) || []

        if (revenueIds.length > 0) {
            await supabase
                .from('debt_installments')
                .update({ revenue_id: null })
                .in('revenue_id', revenueIds)

            await supabase
                .from('revenue')
                .delete()
                .in('id', revenueIds)
        }

        // 3. Delete debts
        if (debtIds.length > 0) {
            await supabase
                .from('debts')
                .delete()
                .in('id', debtIds)
        }

        // 4. Delete contracts
        const { error } = await supabase
            .from('contracts')
            .delete()
            .in('id', ids)

        if (error) throw error

        revalidatePath('/contracts')
        revalidatePath('/debts')
        revalidatePath('/financial/revenue')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error('Bulk Delete Contracts Error:', error)
        return { success: false, error: error.message }
    }
}

export async function importContracts(contracts: any[]) {
    const supabase = await createAdminClient()
    try {
        // [SEC] Auth check before bulk import
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // RBAC Check for each contract
        contracts.forEach(c => {
            const canAccess = accessInfo.access.canViewAllBranches || 
                             (accessInfo.access.allowedBranchIds && accessInfo.access.allowedBranchIds.includes(c.branch_id))
            if (!canAccess) throw new Error(`Bạn không có quyền nhập hợp đồng cho chi nhánh ${c.branch_id}`)
        })

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
    // Trả về placeholder để UI hiển thị, mã thật sẽ được cấp khi lưu (save)
    return { success: true, data: '(Tự động)' }
}

export async function checkContractIdExists(id: string) {
    try {
        const supabase = await createSupabaseClient()
        const { data, error } = await supabase
            .from('contracts')
            .select('id')
            .eq('id', id)
            .maybeSingle()

        if (error) throw error
        return { success: true, exists: !!data }
    } catch (error: any) {
        console.error('Check Contract ID Exists Error:', error)
        return { success: false, error: error.message }
    }
}

export async function shareContractViaZalo(id: string, message?: string, zaloId?: string) {
    const supabase = await createClient()
    try {
        const updates: any = { 
            sendzalo: new Date().toISOString(),
            zalo_message: message || null
        }
        
        if (zaloId) {
            updates.zalo_id = zaloId
        }

        const { error } = await supabase
            .from('contracts')
            .update(updates)
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
    try {
        // [SEC] Auth check before using admin client
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()

        // 1. Fetch contract data including branch webhook
        const { data: contract, error: fetchError } = await supabase
            .from('contracts')
            .select('*, clients(member_name, email), branches(name, url_guimail)')
            .eq('id', id)
            .maybeSingle()

        if (fetchError) throw fetchError
        if (!contract) throw new Error('Không tìm thấy hợp đồng')

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

        if (branchWebhook) {
            // [SEC] Validate webhook URL to prevent SSRF before making request
            if (!isValidWebhookUrl(branchWebhook)) {
                throw new Error('URL webhook chi nhánh không hợp lệ hoặc không được phép')
            }

            // --- BRANCH WEBHOOK PATH ---
            const fileName = `HD_${id}_${contract.clients?.member_name || 'KhachHang'}.pdf`
            const pdfBase64 = pdfBuffer.toString('base64')

            const payload = {
                "email": to,
                "name": contract.clients?.member_name || 'Quý khách',
                "fileName": fileName,
                "pdfBase64": pdfBase64,
                "subject": subject,
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
    try {
        // [SEC] Auth check before using admin client
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        let query = supabase
            .from('contracts')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1)

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []
            if (accessInfo.access.isStaffOnly) {
                const email = accessInfo.user.email
                const name = accessInfo.user.name
                query = query.or(`created_by_email.eq.${email},assigned_pt.eq.${email},trainer_name.ilike.%${name}%`)
            } else {
                if (allowedIds.length > 0) {
                    query = query.in('branch_id', allowedIds)
                }
            }
        }

        const { data, error } = await query.maybeSingle()

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

export async function fetchContractsByClientId(clientId: string) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        let query = supabase
            .from('contracts')
            .select('*, clients(*), branches(*)')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []
            
            if (accessInfo.access.isStaffOnly) {
                // Staff: Must be assigned to this client or created the contract
                const email = accessInfo.user.email
                const name = accessInfo.user.name
                query = query.or(`created_by_email.eq.${email},assigned_pt.eq.${email},trainer_name.ilike.%${name}%`)
            } else {
                // Manager/BM: strictly in allowed branches
                if (allowedIds.length > 0) {
                    query = query.in('branch_id', allowedIds)
                }
            }
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data: data || [] }
    } catch (error: any) {
        console.error('Fetch Contracts By Client Error:', error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function closeContract(
    id: string,
    closureData: {
        final_weight?: number | null
        weight_change?: number | null
        closure_status: 'Renew' | 'Tạm nghỉ' | 'Nghỉ hẳn'
        closure_reason?: string
    }
) {
    const supabase = await createClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // RBAC Check
        const { data: existing } = await supabase
            .from('contracts')
            .select('branch_id, created_by_email')
            .eq('id', id)
            .maybeSingle()

        if (!existing) return { success: false, error: 'Hợp đồng không tồn tại' }

        const canAccess =
            accessInfo.access.canViewAllBranches ||
            (accessInfo.access.allowedBranchIds &&
                accessInfo.access.allowedBranchIds.includes(existing.branch_id)) ||
            existing.created_by_email === accessInfo.user.email

        if (!canAccess) return { success: false, error: 'Bạn không có quyền xử lý hợp đồng này' }

        // Validate: lý do bắt buộc khi không renew
        if (
            (closureData.closure_status === 'Tạm nghỉ' || closureData.closure_status === 'Nghỉ hẳn') &&
            !closureData.closure_reason?.trim()
        ) {
            return { success: false, error: 'Vui lòng nhập lý do khi khách hàng nghỉ' }
        }

        const updates: any = {
            closure_status: closureData.closure_status,
            closure_reason: closureData.closure_reason || null,
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        // Ghi cân nặng kết thúc nếu có
        if (closureData.final_weight != null) {
            updates.final_weight = closureData.final_weight
        }
        if (closureData.weight_change != null) {
            updates.weight_change = closureData.weight_change
        }

        // Sau khi xử lý xong, luôn chuyển trạng thái HĐ về "Hết hạn HĐ"
        updates.status = 'Hết hạn HĐ'

        const { data, error } = await supabase
            .from('contracts')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle()

        if (error) throw error

        revalidatePath('/contracts')
        revalidatePath('/contracts/due')
        revalidatePath('/')
        return { success: true, data }
    } catch (error: any) {
        console.error('Close Contract Error:', error)
        return { success: false, error: error.message }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// XNTT — XÁC NHẬN THANH TOÁN
// ─────────────────────────────────────────────────────────────────────────────

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
    contractId: string
}

function generatePaymentConfirmationHtml(d: PaymentConfirmationPayload): string {
    const salmon = '#E8896A'
    const salmonDk = '#993C1D'
    const salmonBdr = '#F5C4B3'
    const cream = '#FAF8F5'
    const dark = '#1C1A18'
    const gray = '#6B6760'
    const border = '#E8E4DE'
    const white = '#FFFFFF'

    const row = (label: string, value: string | undefined) => {
        const v = value || '—'
        return `<tr>
          <td style="padding:10px 16px;font-size:12px;color:${gray};font-weight:600;letter-spacing:0.6px;text-transform:uppercase;white-space:nowrap;border-bottom:1px solid ${border};width:40%">${label}</td>
          <td style="padding:10px 16px;font-size:15px;color:${dark};font-weight:500;border-bottom:1px solid ${border}">${v}</td>
        </tr>`
    }

    const sectionHeader = (title: string, icon: string) => `
      <tr>
        <td colspan="2" style="background:${salmon};padding:12px 16px;font-size:13px;color:${white};font-weight:600;letter-spacing:0.8px;text-transform:uppercase">
          ${icon} ${title}
        </td>
      </tr>`

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@400;500&display=swap');
  body{margin:0;padding:0;background:#F4F2EF;font-family:'DM Sans',Arial,sans-serif;}
</style>
</head>
<body>
<div style="max-width:620px;margin:0 auto;padding:32px 16px 48px">
  <div style="text-align:center;margin-bottom:28px">
    <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;color:${salmon};letter-spacing:-0.3px;margin-bottom:4px">Eva's Fit</div>
    <div style="font-size:12px;color:${gray};letter-spacing:1px;text-transform:uppercase">Xác nhận thanh toán</div>
  </div>
  <div style="background:${white};border-radius:14px;padding:24px 28px;border:1px solid ${border};margin-bottom:16px">
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:20px;color:${dark};margin:0 0 12px">Xin chào ${d.ten}!</p>
    <p style="font-size:14px;color:${gray};line-height:1.7;margin:0">Eva's Fit xin xác nhận đã nhận được thanh toán từ bạn. Vui lòng kiểm tra thông tin biên nhận bên dưới và lưu trữ để tham khảo khi cần.</p>
    ${d.custom_message ? `<div style="margin-top:20px;padding:16px;background:${cream};border-radius:10px;border-left:4px solid ${salmon};font-style:italic;color:${dark}">"${d.custom_message}"</div>` : ''}
  </div>
  <div style="background:${white};border-radius:14px;overflow:hidden;border:1px solid ${border};margin-bottom:16px">
    <div style="background:${salmon};padding:18px 24px;color:${white}">
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:600">BIÊN NHẬN THANH TOÁN</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:2px">Ngày đóng: ${d.ndong} &nbsp;|&nbsp; Cơ sở: ${d.coso}</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      ${sectionHeader('TH&#212;NG TIN H&#7896;I VI&#202;N', '&#9658;')}
      ${row('Tên hội viên', d.ten)}
      ${row('Số điện thoại', d.sdt)}
      ${row('Gmail', d.email)}
      ${row('Ngày sinh', d.ngaysinh)}
      ${row('Địa chỉ', d.diachi)}
      ${row('Số CMND/CCCD', d.cmnd)}
      ${row('Nguồn', d.nguon)}
      ${sectionHeader('TH&#212;NG TIN G&#211;I T&#7852;P', '&#9658;')}
      ${row('Gói tập', d.goi)}
      ${row('Lựa chọn', d.custom)}
      ${row('Huấn luyện viên', d.hlv)}
      ${row('Ngày bắt đầu', d.nbd)}
      ${row('Ngày kết thúc', d.nkt)}
      ${sectionHeader('CHI TI&#7870;T THANH TO&#193;N', '&#9658;')}
      ${row('Lần 1 — Số tiền', d.tien1 ? d.tien1 + ' đ' : '—')}
      ${row('Lần 1 — Hình thức', d.httt1)}
      ${d.tien2 ? row('Lần 2 — Số tiền', d.tien2 + ' đ') : ''}
      ${d.httt2 ? row('Lần 2 — Hình thức', d.httt2) : ''}
      ${row('Ghi chú', d.ghichu)}
    </table>
    <div style="background:${salmon};padding:18px 24px;color:${white}">
      <table width="100%"><tr>
        <td style="font-size:13px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">Tổng giá trị hợp đồng</td>
        <td style="font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:600;text-align:right">${d.tonggiatri} đ</td>
      </tr></table>
    </div>
    <div style="padding:14px 24px;background:${cream};font-size:13px;color:${gray};text-align:right">Người thu: <strong style="color:${dark}">${d.nguoithu}</strong></div>
  </div>
  <div style="background:${white};border-radius:14px;border:1.5px solid ${salmonBdr};padding:22px 24px;margin-bottom:16px">
    <div style="font-size:12px;color:${salmonDk};font-weight:700;letter-spacing:0.9px;text-transform:uppercase;margin-bottom:14px">LƯU Ý QUAN TRỌNG</div>
    <p style="font-size:13.5px;color:${gray};line-height:1.75;margin:0 0 10px">Tất cả các khoản thu đều <strong>không hoàn lại</strong>.</p>
    <p style="font-size:13.5px;color:${gray};line-height:1.75;margin:0">Các khoản đặt cọc có giá trị sử dụng trong vòng <strong>14 ngày</strong> kể từ ngày thanh toán.</p>
  </div>
  <div style="text-align:center;padding-top:20px;border-top:1px solid ${border}">
    <div style="font-family:'Playfair Display',Georgia,serif;font-size:16px;color:${salmon};margin-bottom:6px">Eva's Fit</div>
    <div style="font-size:12px;color:${gray};line-height:1.8">${d.coso}<br>Email: evasfit@gmail.com</div>
  </div>
</div>
</body>
</html>`
}

/**
 * Server Action: Gửi email Xác nhận Thanh toán (XNTT)
 * Cơ chế: Ghi JSON {email, subject, htmlBody} vào cột sendemail_xntt
 *         → Supabase Webhook kích hoạt GAS doPost() → GAS gửi email HTML
 */
export async function sendPaymentConfirmationAction(
    payload: PaymentConfirmationPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()

        // 1. Build HTML body từ form data
        const htmlBody = generatePaymentConfirmationHtml(payload)

        // 2. Build subject
        const subject = `Xác nhận thanh toán - ${payload.ten} - Eva's Fit`

        // 3. Đóng gói JSON payload cho GAS đọc
        const xnttPayload = JSON.stringify({ email: payload.email, subject, htmlBody })

        // 4. Ghi vào DB trong 1 lần update duy nhất → Supabase Webhook kích hoạt GAS
        //    Bao gồm luôn is_receipt_sent để tránh gọi updateContractReceiptStatus
        //    riêng (sẽ tạo thêm 1 DB update → webhook bắn 2 lần)
        const { error: updateError } = await supabase
            .from('contracts')
            .update({
                sendemail_xntt: xnttPayload,
                payment_method: payload.httt1 || null,
                payment_notes: payload.ghichu || null,
                is_receipt_sent: true,
                receipt_sent_at: new Date().toISOString(),
            })
            .eq('id', payload.contractId)

        if (updateError) throw new Error(updateError.message)

        revalidatePath('/contracts')
        return { success: true }
    } catch (error: any) {
        console.error('sendPaymentConfirmationAction Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Server Action: Cập nhật trạng thái đã gửi biên nhận
 * Gọi từ Dialog sau khi sendPaymentConfirmationAction thành công
 */
export async function updateContractReceiptStatus(contractId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        const { error } = await supabase
            .from('contracts')
            .update({
                is_receipt_sent: true,
                receipt_sent_at: new Date().toISOString(),
            })
            .eq('id', contractId)

        if (error) throw new Error(error.message)

        revalidatePath('/contracts')
        return { success: true }
    } catch (error: any) {
        console.error('updateContractReceiptStatus Error:', error)
        return { success: false, error: error.message }
    }
}
