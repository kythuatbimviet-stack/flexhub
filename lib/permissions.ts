
export type UserPosition = 'CEO' | 'Quản lý' | 'Quản lý chi nhánh' | 'Nhân viên'

export interface UserProfile {
    email: string
    name: string
    permissions: string | null
    position: UserPosition
    branch_id?: string
    managed_branches?: string | string[] | null
}

export interface AccessControl {
    canViewAllBranches: boolean
    canManageUsers: boolean
    allowedBranchIds?: string[] // Array of branch IDs user can access
    isStaffOnly: boolean   // If true, user only sees data they created or are assigned to
}

export function getAccessControl(user: UserProfile): AccessControl {
    const permissions = user.permissions
    const position = user.position

    // Parse managed branches if it's a string
    let managedBranches: string[] = []
    if (user.managed_branches) {
        if (Array.isArray(user.managed_branches)) {
            managedBranches = user.managed_branches
        } else if (typeof user.managed_branches === 'string') {
            const cleaned = user.managed_branches.trim()
            if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
                try {
                    // Handle JSON or Postgres array format
                    const jsonStr = cleaned.replace(/{/g, '[').replace(/}/g, ']')
                    managedBranches = JSON.parse(jsonStr)
                } catch (e) {
                    console.error('Failed to parse managed_branches as JSON/Array:', e)
                    // Fallback to comma separation
                    managedBranches = cleaned.split(',').map(s => s.trim()).filter(Boolean)
                }
            } else if (cleaned) {
                // Handle simple comma-separated string
                managedBranches = cleaned.split(',').map(s => s.trim()).filter(Boolean)
            }
        }
    }

    // Admin: Full access to everything
    if (permissions === 'Admin') {
        return {
            canViewAllBranches: true,
            canManageUsers: true,
            isStaffOnly: false
        }
    }

    // CEO: Full branch access, but no user management
    if (position === 'CEO') {
        return {
            canViewAllBranches: true,
            canManageUsers: false,
            isStaffOnly: false
        }
    }

    // Quản lý (Manager)
    if (position === 'Quản lý') {
        const hasManagedBranches = managedBranches.length > 0
        return {
            canViewAllBranches: !hasManagedBranches,
            canManageUsers: false,
            allowedBranchIds: hasManagedBranches ? managedBranches : undefined,
            isStaffOnly: false
        }
    }

    // Quản lý chi nhánh (Branch Manager): Limited to their own branch
    if (position === 'Quản lý chi nhánh') {
        return {
            canViewAllBranches: false,
            canManageUsers: false,
            allowedBranchIds: user.branch_id ? [user.branch_id] : [],
            isStaffOnly: false
        }
    }

    // Staff (Nhân viên): Limited to their own branch + only assigned data
    return {
        canViewAllBranches: false,
        canManageUsers: false,
        allowedBranchIds: user.branch_id ? [user.branch_id] : [],
        isStaffOnly: true
    }
}

/**
 * Check if a user can access a specific record (client or contract)
 */
export function canAccessRecord(user: UserProfile, record: any): boolean {
    const access = getAccessControl(user)

    // 1. Ownership/Assignment always grants access regardless of branch
    const isOwner = record.created_by_email === user.email
    const isAssigned = record.assigned_pt === user.email || record.trainer_name === user.name
    if (isOwner || isAssigned) return true

    // 2. Check branch access for non-owners
    if (!access.canViewAllBranches && access.allowedBranchIds) {
        if (!access.allowedBranchIds.includes(record.branch_id)) return false
    }

    // 3. Check ownership/assignment for staff (redundant but safe)
    if (access.isStaffOnly) {
        return isOwner || isAssigned
    }

    return true
}

/**
 * Check if user can perform Admin actions (like deleting users)
 */
export function isAdmin(user: UserProfile): boolean {
    return user.permissions === 'Admin'
}
