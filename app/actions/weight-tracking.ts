'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { format, parseISO } from 'date-fns'

export async function fetchWeightRecords() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('weight_tracking')
            .select('*')
            .order('measurement_date', { ascending: false })

        if (error) {
            console.error('Fetch Weight Records Error:', error)
            return { success: false, error: `${error.code}: ${error.message} - ${error.details}` }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * fetchWeightRecordsRecent — Fetch chỉ N ngày gần nhất để tăng tốc load.
 * 
 * ✅ Filter server-side: chỉ transfer data thực sự cần thiết.
 * ✅ RBAC qua Supabase RLS (createClient dùng session của user).
 * ✅ Default 180 ngày — đủ cho Gantt view thông thường.
 * 
 * @param days Số ngày gần nhất cần lấy (default: 180)
 */
export async function fetchWeightRecordsRecent(days: number = 180) {
    try {
        const supabase = await createClient()
        const since = new Date()
        since.setDate(since.getDate() - days)
        const sinceStr = since.toISOString().split('T')[0] // YYYY-MM-DD

        const { data, error } = await supabase
            .from('weight_tracking')
            .select('*')
            .gte('measurement_date', sinceStr)
            .order('measurement_date', { ascending: false })

        if (error) {
            console.error('Fetch Recent Weight Records Error:', error)
            return { success: false, error: `${error.code}: ${error.message} - ${error.details}` }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Recent Error:', error)
        return { success: false, error: error.message }
    }
}


export async function createWeightRecord(record: any) {
    try {
        const adminClient = await createAdminClient()
        const supabase = await createClient()
        
        // Get current user for audit
        const { data: { user } } = await supabase.auth.getUser()
        
        const mDate = parseISO(record.measurement_date)
        
        // Ensure ID, timestamps and schema-matching fields are handled
        const finalRecord = {
            ...record,
            id: record.id || crypto.randomUUID(),
            month: format(mDate, 'MM/yyyy'),
            day: record.measurement_date, // day column matches measurement_date format
            created_by: user?.id || null,
            created_at: record.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const { data, error } = await adminClient
            .from('weight_tracking')
            .insert(finalRecord)
            .select()
            .single()

        if (error) {
            console.error('Create Weight Record Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/weight-tracking')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Create Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateWeightRecord(id: string, updates: any) {
    try {
        const adminClient = await createAdminClient()
        
        // If measurement_date is being updated, recalculate month and day
        let finalUpdates = { ...updates, updated_at: new Date().toISOString() }
        
        if (updates.measurement_date) {
            const mDate = parseISO(updates.measurement_date)
            finalUpdates.month = format(mDate, 'MM/yyyy')
            finalUpdates.day = updates.measurement_date
        }

        const { data, error } = await adminClient
            .from('weight_tracking')
            .update(finalUpdates)
            .eq('id', id)

        if (error) {
            console.error('Update Weight Record Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/weight-tracking')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteWeightRecord(id: string) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('weight_tracking')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete Weight Record Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/weight-tracking')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteBulkWeightRecords(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('weight_tracking')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Delete Bulk Weight Records Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/weight-tracking')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchWeightChartData(clientId: string) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('weight_tracking')
            .select('measurement_date, weight')
            .eq('client_id', clientId)
            .order('measurement_date', { ascending: true })

        if (error) {
            console.error('Fetch Chart Data Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Chart Data Fetch Error:', error)
        return { success: false, error: error.message }
    }
}
export async function upsertWeightRecord(clientId: string, date: string, field: 'weight' | 'height', value: number, contractId?: string | null) {
    try {
        const adminClient = await createAdminClient()

        // Check if record exists for this client and date
        const { data: existing, error: fetchError } = await adminClient
            .from('weight_tracking')
            .select('id')
            .eq('client_id', clientId)
            .eq('measurement_date', date)
            .maybeSingle()

        if (fetchError) throw fetchError

        if (existing) {
            // Update
            const { error: updateError } = await adminClient
                .from('weight_tracking')
                .update({ [field]: value })
                .eq('id', existing.id)
            if (updateError) throw updateError
        } else {
            // Insert
            const { error: insertError } = await adminClient
                .from('weight_tracking')
                .insert({
                    id: crypto.randomUUID(),
                    client_id: clientId,
                    contract_id: contractId,
                    measurement_date: date,
                    [field]: value
                })
            if (insertError) throw insertError
        }

        revalidatePath('/weight-tracking')
        return { success: true }
    } catch (error: any) {
        console.error('Upsert Weight Record Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchLatestWeightRecordByClientId(clientId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('weight_tracking')
            .select('*')
            .eq('client_id', clientId)
            .order('measurement_date', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('Fetch Latest Weight Record Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}
export async function fetchClientWeightHistory(clientId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('weight_tracking')
            .select('*')
            .eq('client_id', clientId)
            .order('measurement_date', { ascending: false })

        if (error) {
            console.error('Fetch Client Weight History Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchTrainingLogs(startDate: string, endDate: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('training_logs')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)

        if (error) {
            console.error('Fetch Training Logs Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchClientTrainingLogs(clientId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('training_logs')
            .select('*')
            .eq('client_id', clientId)
            .order('date', { ascending: false })

        if (error) {
            console.error('Fetch Client Training Logs Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function upsertTrainingStatus(clientId: string, date: string, status: 'Y' | 'N' | 'TĐ' | null) {
    try {
        const adminClient = await createAdminClient()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!status) {
            // Delete if status is null
            const { error: deleteError } = await adminClient
                .from('training_logs')
                .delete()
                .eq('client_id', clientId)
                .eq('date', date)
            if (deleteError) throw deleteError
            revalidatePath('/weight-tracking')
            return { success: true }
        }

        const { error } = await adminClient
            .from('training_logs')
            .upsert({
                client_id: clientId,
                date: date,
                status: status,
                updated_by: user?.id || null,
                updated_at: new Date().toISOString()
            }, { 
                onConflict: 'client_id,date' 
            })

        if (error) {
            console.error('Upsert Training Status Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/weight-tracking')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Upsert Error:', error)
        return { success: false, error: error.message }
    }
}
