'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { getAccessFilter } from '@/lib/access-filter'

export async function fetchClientBirthdays(startDate?: string, endDate?: string) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        
        let query = supabase.from('clients').select(`
            id,
            member_name,
            phone,
            email,
            dob,
            age,
            avatar_url,
            branch_id,
            pt_name,
            branches (name)
        `).order('dob', { ascending: true })

        // Apply RBAC filters (Standard Client Filtering Logic)
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []
            if (accessInfo.access.isStaffOnly) {
                if (allowedIds.length > 0) query = query.in('branch_id', allowedIds)
                const email = accessInfo.user.email
                const name = accessInfo.user.name
                query = query.or(`created_by_email.eq.${email},assigned_pt.eq.${email},pt_name.ilike.%${name}%`)
            } else {
                if (allowedIds.length > 0) query = query.in('branch_id', allowedIds)
                else query = query.eq('created_by_email', accessInfo.user.email)
            }
        }

        const { data, error } = await query
        if (error) throw error

        let filtered = data || []

        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            start.setHours(0, 0, 0, 0)
            end.setHours(23, 59, 59, 999)

            filtered = (data || []).filter((client: any) => {
                if (!client.dob) return false
                const dob = new Date(client.dob)
                
                // Compare birthday within the range regardless of the birth year
                // We normalize the birthday to the years covered by the range [start, end]
                const yearsToTest = [start.getFullYear(), end.getFullYear()]
                
                return yearsToTest.some(year => {
                    const normalizedBday = new Date(year, dob.getMonth(), dob.getDate())
                    return normalizedBday >= start && normalizedBday <= end
                })
            })
        }

        // Sort by (Month, Day)
        filtered.sort((a: any, b: any) => {
            const da = new Date(a.dob)
            const db = new Date(b.dob)
            if (da.getMonth() !== db.getMonth()) return da.getMonth() - db.getMonth()
            return da.getDate() - db.getDate()
        })

        return { success: true, data: filtered }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function fetchStaffBirthdays(period: 'week' | 'month' = 'month') {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        
        let query = supabase.from('users').select(`
            id,
            name,
            phone,
            email,
            dob,
            age,
            avatar_url,
            branch_id,
            position,
            department,
            branches (name)
        `)

        const { data, error } = await query
        if (error) throw error

        const now = new Date()
        const currentMonth = now.getMonth() + 1
        
        console.log(`[fetchStaffBirthdays] Period: ${period}, Current Month: ${currentMonth}`)

        const filtered = (data || []).filter((user: any) => {
            if (!user.dob) return false
            
            const dob = new Date(user.dob)
            const dobStr = String(user.dob)
            let birthMonth: number
            
            if (dobStr.includes('-')) {
                // If it's YYYY-MM-DD, parsing directly is safer vs Timezone shifts
                const parts = dobStr.split('-')
                birthMonth = parseInt(parts[1], 10)
            } else {
                birthMonth = dob.getMonth() + 1
            }

            if (period === 'month') {
                const isMatch = birthMonth === currentMonth
                if (isMatch) console.log(`[fetchStaffBirthdays] Match found: ${user.name} (Month: ${birthMonth})`)
                return isMatch
            } else if (period === 'week') {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                const nextWeek = new Date(today)
                nextWeek.setDate(today.getDate() + 7)

                const years = [today.getFullYear(), today.getFullYear() + 1]
                return years.some(year => {
                    const bday = new Date(year, dob.getMonth(), dob.getDate())
                    return bday >= today && bday <= nextWeek
                })
            }
            return false
        })

        filtered.sort((a: any, b: any) => {
            const da = new Date(a.dob)
            const db = new Date(b.dob)
            if (da.getMonth() !== db.getMonth()) return da.getMonth() - db.getMonth()
            return da.getDate() - db.getDate()
        })

        return { success: true, data: filtered }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
