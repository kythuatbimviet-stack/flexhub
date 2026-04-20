'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMyDefinitiveProfileByEmail } from '@/app/actions/users'
import { getAccessControl, UserProfile, AccessControl } from '@/lib/permissions'
import React from 'react'

/**
 * Returns a stable fingerprint of the permission-relevant fields.
 * If any of these change (role, position, branch), we invalidate all data caches.
 */
function getPermissionFingerprint(user: UserProfile | null): string {
    if (!user) return ''
    return [
        (user as any).role_id,
        (user as any).permissions,
        user.position,
        user.branch_id,
        user.managed_branches,
        (user as any).status,
    ].join('|')
}

export function usePermissions() {
    const queryClient = useQueryClient()
    const fingerprintRef = React.useRef<string>('')

    const { data: profileResult, isLoading } = useQuery({
        queryKey: ['current-user-profile'],
        queryFn: fetchMyDefinitiveProfileByEmail,
        // Cache profile trong 2 phút để tránh spam request khi switch tab
        staleTime: 2 * 60 * 1000,
        // Refetch every time the user looks at the page (tab focus / reconnect)
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    })

    const user = profileResult?.success ? profileResult.data as UserProfile : null

    // 🔑 Detect permission change: if fingerprint differs, flush all data caches
    React.useEffect(() => {
        const newFingerprint = getPermissionFingerprint(user)
        if (fingerprintRef.current && newFingerprint && fingerprintRef.current !== newFingerprint) {
            console.info('[usePermissions] Permission change detected — flushing data caches')
            // Invalidate all business data so they re-fetch with the new permission context
            queryClient.invalidateQueries({ queryKey: ['clients-all'] })
            queryClient.invalidateQueries({ queryKey: ['contracts-all'] })
            queryClient.invalidateQueries({ queryKey: ['revenue'] })
            queryClient.invalidateQueries({ queryKey: ['expense'] })
            queryClient.invalidateQueries({ queryKey: ['debts-all'] })
            queryClient.invalidateQueries({ queryKey: ['zalo-users-all'] })
            queryClient.invalidateQueries({ queryKey: ['client-filter-options'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
        }
        fingerprintRef.current = newFingerprint
    }, [user, queryClient])

    const permissions: AccessControl = React.useMemo(() => {
        return user
            ? getAccessControl(user)
            : {
                canViewAllBranches: false,
                canManageUsers: false,
                isStaffOnly: true
            }
    }, [user])

    return React.useMemo(() => ({
        user,
        permissions,
        isLoading,
        isAdmin: (user as any)?.permissions === 'Admin',
        isCEO: user?.position === 'CEO',
        isManager: user?.position === 'Quản lý',
        isBranchManager: user?.position === 'Quản lý chi nhánh',
        isStaff: user?.position === 'Nhân viên' || user?.position === 'Huấn luyện viên',
    }), [user, permissions, isLoading])
}
