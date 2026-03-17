'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUserProfile } from '@/app/actions/users'
import { getAccessControl, UserProfile, AccessControl } from '@/lib/permissions'

export function usePermissions() {
    const { data: profileResult, isLoading } = useQuery({
        queryKey: ['current-user-profile'],
        queryFn: fetchCurrentUserProfile,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const user = profileResult?.success ? profileResult.data as UserProfile : null
    
    const permissions: AccessControl = user 
        ? getAccessControl(user)
        : {
            canViewAllBranches: false,
            canManageUsers: false,
            isStaffOnly: true
        }

    return {
        user,
        permissions,
        isLoading,
        isAdmin: user?.role_id === 'Admin',
        isCEO: user?.position === 'CEO',
        isManager: user?.position === 'Quản lý',
        isBranchManager: user?.position === 'Quản lý chi nhánh',
        isStaff: user?.position === 'Nhân viên',
    }
}
