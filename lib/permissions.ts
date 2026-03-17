
export type UserPosition = 'CEO' | 'Quản lý' | 'Quản lý chi nhánh' | 'Nhân viên'

export interface UserProfile {
    email: string
    name: string
    permissions: string | null
    position: UserPosition
    branch_id?: string
}

export interface AccessControl {
    canViewAllBranches: boolean
    canManageUsers: boolean
    branchIdLimit?: string // If set, user only sees data from this branch
    isStaffOnly: boolean   // If true, user only sees data they created or are assigned to
}

export function getAccessControl(user: UserProfile): AccessControl {
    const permissions = user.permissions
    const position = user.position

    // Admin: Full access
    if (permissions === 'Admin') {
        return {
            canViewAllBranches: true,
            canManageUsers: true,
            isStaffOnly: false
        }
    }

    // Positions that can see everything (CEO, Manager)
    if (position === 'CEO' || position === 'Quản lý') {
        return {
            canViewAllBranches: true,
            canManageUsers: false,
            isStaffOnly: false
        }
    }

    if (position === 'Quản lý chi nhánh') {
        return {
            canViewAllBranches: false,
            canManageUsers: false,
            branchIdLimit: user.branch_id,
            isStaffOnly: false
        }
    }

    // Staff (Nhân viên)
    return {
        canViewAllBranches: false,
        canManageUsers: false,
        branchIdLimit: user.branch_id,
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
    if (!access.canViewAllBranches) {
        if (record.branch_id !== user.branch_id) return false
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
