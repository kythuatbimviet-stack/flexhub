'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchCustomers() {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Fetch Customers Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function importCustomers(customers: any[]) {
    try {
        // Deduplicate customers by ID (keep the last occurrence in the batch)
        const uniqueCustomers = Array.from(
            new Map(customers.map(c => [c.id, c]))
                .values()
        )

        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('customers')
            .upsert(uniqueCustomers, { onConflict: 'id' })

        if (error) {
            console.error('Server Action Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/customers')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Server Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteCustomers(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('customers')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Bulk Delete Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/customers')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateCustomer(id: string, updates: any) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('customers')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Update Customer Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/customers')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}
