'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    Building2,
    Briefcase,
    Shield,
    Trash,
    UserCircle,
    MoreVertical,
    FileDown,
    ChevronDown,
    XCircle,
    CheckCircle2,
    RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fetchUsers, bulkDeleteUsers } from '@/app/actions/users'
import { fetchBranches } from '@/app/actions/branches'
import * as XLSX from 'xlsx'

import { AddUserDialog } from '@/components/users/add-user-dialog'
import { UserDetailsSheet } from '@/components/users/user-details-sheet'
import { ImportUsersDialog } from '@/components/users/import-users-dialog'

export default function UsersPage() {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedUser, setSelectedUser] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    // Filter states
    const [filterStatus, setFilterStatus] = React.useState('all')
    const [filterBranch, setFilterBranch] = React.useState('all')
    const [filterDepartment, setFilterDepartment] = React.useState('all')
    const [filterPosition, setFilterPosition] = React.useState('all')

    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const result = await fetchUsers()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    })

    // Sync selected user with updated data from refetch
    React.useEffect(() => {
        if (selectedUser && users) {
            const updatedUser = users.find((u: any) => u.id === selectedUser.id)
            if (updatedUser) {
                setSelectedUser(updatedUser)
            }
        }
    }, [users, selectedUser?.id])

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) return []
            return result.data
        },
        staleTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    })

    // Derived unique values for filters
    const departments = React.useMemo(() => {
        if (!users) return []
        const deps = new Set(users.map(u => u.department).filter(Boolean))
        return Array.from(deps).sort()
    }, [users])

    const positions = React.useMemo(() => {
        if (!users) return []
        const pos = new Set(users.map(u => u.position).filter(Boolean))
        return Array.from(pos).sort()
    }, [users])

    const handleRowClick = (user: any, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'label'
        ) {
            return
        }
        setSelectedUser(user)
        setIsDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa nhân sự này?')) {
            const result = await bulkDeleteUsers([id])
            if (!result.success) {
                toast.error('Lỗi khi xóa: ' + result.error)
            } else {
                toast.success('Đã xóa nhân sự thành công')
                refetch()
            }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} nhân sự đã chọn?`)) {
            const result = await bulkDeleteUsers(selectedRows)
            if (!result.success) {
                toast.error('Lỗi khi xóa hàng loạt: ' + result.error)
            } else {
                toast.success(`Đã xóa thành công ${selectedRows.length} nhân sự`)
                setSelectedRows([])
                refetch()
            }
        }
    }

    const handleExport = () => {
        if (!filteredUsers || filteredUsers.length === 0) {
            toast.error('Không có dữ liệu để xuất')
            return
        }

        const dataToExport = filteredUsers.map(u => ({
            'Họ và tên': u.name,
            'Email': u.email,
            'Số điện thoại': u.phone,
            'Chi nhánh': u.branches?.name || u.branch_name,
            'Phòng ban': u.department,
            'Chức vụ': u.position,
            'Vai trò': u.permissions,
            'Trạng thái': u.status === 'Activated' ? 'Đang hoạt động' : 'Tạm ngưng',
            'Ngày tham gia': u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : ''
        }))

        const worksheet = XLSX.utils.json_to_sheet(dataToExport)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Nhân sự Eva\'s Fit')
        XLSX.writeFile(workbook, `LadyFit_NhanSu_${new Date().toISOString().slice(0, 10)}.xlsx`)
        toast.success('Đã xuất file Excel thành công')
    }

    const filteredUsers = users?.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = filterStatus === 'all' || user.status === filterStatus
        const matchesBranch = filterBranch === 'all' || user.branch_id === filterBranch
        const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment
        const matchesPosition = filterPosition === 'all' || user.position === filterPosition

        return matchesSearch && matchesStatus && matchesBranch && matchesDepartment && matchesPosition
    })

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedRows.length === (filteredUsers?.length || 0)) {
            setSelectedRows([])
        } else {
            setSelectedRows(filteredUsers?.map(u => u.id) || [])
        }
    }

    const resetFilters = () => {
        setFilterStatus('all')
        setFilterBranch('all')
        setFilterDepartment('all')
        setFilterPosition('all')
        setSearchTerm('')
    }

    return (
        <div className="space-y-1.5 font-inter pb-10">
            <UserDetailsSheet
                user={selectedUser}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onSuccess={refetch}
                branches={branches || []}
            />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-gray-50 flex items-center gap-2">
                        <UserCircle className="w-8 h-8 text-red-600" />
                        Quản lý Nhân sự
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Quản lý đội ngũ Eva's Fit.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AnimatePresence>
                        {selectedRows.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={handleBulkDelete}
                                    className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold px-4 h-11 rounded-xl transition-all"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <ImportUsersDialog onSuccess={refetch} />
                    <Button onClick={handleExport} variant="ghost" className="rounded-xl h-11 px-4 font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-600 dark:text-slate-300">
                        <FileDown className="w-4 h-4 mr-2 text-emerald-500" />
                        Xuất Excel
                    </Button>
                    <AddUserDialog onSuccess={refetch} />
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-slate-900 transition-all duration-300 py-0">
                <div className="py-1 px-1 sm:px-1.5 border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        {/* Search & Toggle Row */}
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    placeholder="Tìm kiếm nhân sự..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 bg-white dark:bg-slate-800 border-none rounded-lg focus:ring-1 focus:ring-red-500 text-sm h-9 transition-all outline-none"
                                />
                            </div>

                            {/* Mobile Filter Toggle */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={cn(
                                    "lg:hidden h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800 transition-all",
                                    showMobileFilters ? "bg-red-50 text-red-600 border-red-200 shadow-sm" : "bg-white dark:bg-gray-800/50"
                                )}
                            >
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Filters Content */}
                        <AnimatePresence>
                            {(showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                <motion.div
                                    initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden lg:overflow-visible lg:flex lg:flex-row lg:items-center gap-2"
                                >
                                    <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center pt-2 lg:pt-0">
                                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                                            <SelectTrigger className="w-full lg:w-[150px] rounded-lg border-none h-9 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-red-500 shadow-none">
                                                <SelectValue placeholder="Trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                                <SelectItem value="Activated">Đang hoạt động</SelectItem>
                                                <SelectItem value="Deactivated">Tạm ngưng</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={filterBranch} onValueChange={setFilterBranch}>
                                            <SelectTrigger className="w-full lg:w-[150px] rounded-lg border-none h-9 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-red-500 shadow-none">
                                                <SelectValue placeholder="Chi nhánh" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                                {branches?.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                                            <SelectTrigger className="w-full lg:w-[130px] rounded-lg border-none h-9 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-red-500 shadow-none">
                                                <SelectValue placeholder="Phòng ban" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                                <SelectItem value="all">Phòng ban</SelectItem>
                                                {departments.map(d => (
                                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={filterPosition} onValueChange={setFilterPosition}>
                                            <SelectTrigger className="w-full lg:w-[130px] rounded-lg border-none h-9 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-red-500 shadow-none">
                                                <SelectValue placeholder="Chức vụ" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                                <SelectItem value="all">Chức vụ</SelectItem>
                                                {positions.map(p => (
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="ghost"
                                            onClick={resetFilters}
                                            className="h-9 px-3 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all shrink-0 col-span-2 lg:col-span-1 justify-center lg:w-auto"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2 lg:mr-0" />
                                            <span className="lg:hidden text-sm font-medium">Làm mới bộ lọc</span>
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Card>

            {/* Table Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-500">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent border-t-0">
                                <TableHead className="w-14 pl-8 h-9 text-center">
                                    <Checkbox
                                        checked={selectedRows.length === (filteredUsers?.length || 0) && (filteredUsers?.length || 0) > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-slate-300 dark:border-slate-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 shadow-sm"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Nhân sự & Liên hệ</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Vị trí & Phòng ban</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Chi nhánh</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Vai trò</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Trạng thái</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9 text-right pr-10">Tùy chọn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-96 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-14 h-14 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin shadow-inner" />
                                            <span className="text-slate-400 font-medium text-sm">Đang tải danh sách nhân sự...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-96 text-center">
                                        <div className="flex flex-col items-center gap-5">
                                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                                                <UserCircle className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-widest text-[11px]">Không có dữ liệu</p>
                                                <p className="text-slate-400 text-sm font-medium">Thử thay đổi bộ lọc hoặc tìm kiếm khác xem sạo</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers?.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        onClick={(e) => handleRowClick(user, e)}
                                        className={cn(
                                            "border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all group cursor-pointer",
                                            selectedRows.includes(user.id) && "bg-red-50/20 dark:bg-red-950/10"
                                        )}
                                    >
                                        <TableCell className="pl-8 py-2">
                                            <Checkbox
                                                checked={selectedRows.includes(user.id)}
                                                onCheckedChange={() => toggleRow(user.id)}
                                                className="rounded-lg border-slate-300 dark:border-slate-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 shadow-sm"
                                            />
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 font-bold text-sm ring-2 ring-transparent group-hover:ring-red-100 dark:group-hover:ring-red-900/40 transition-all overflow-hidden bg-cover bg-center shadow-sm" style={{ backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none' }}>
                                                    {!user.avatar_url && (user.name?.charAt(0) || 'U')}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-50 text-[15px] group-hover:text-red-600 transition-colors">{user.name}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{user.position || 'Nhân viên'}</span>
                                                <span className="text-[11px] text-slate-400 font-medium pl-3 border-l-2 border-slate-100 dark:border-slate-800">{user.department || 'Văn phòng'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium text-[13px]">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <Building2 className="w-3.5 h-3.5" />
                                                </div>
                                                {user.branches?.name || user.branch_name || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="inline-flex items-center px-4 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                                                {user.permissions || 'User'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold shadow-sm",
                                                user.status === 'Activated'
                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", user.status === 'Activated' ? "bg-emerald-600" : "bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]")} />
                                                {user.status === 'Activated' ? 'Đang hoạt động' : 'Tạm ngưng'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setIsDetailsOpen(true)
                                                    }}
                                                    className="h-10 w-10 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 transition-all"
                                                >
                                                    <Edit2 className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(user.id)}
                                                    className="h-10 w-10 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-all"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm border border-slate-50 dark:border-slate-800">
                        Hiển thị <span className="font-bold text-slate-900 dark:text-white px-1">{filteredUsers?.length || 0}</span> nhân viên
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg h-9 px-4 font-semibold text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all" disabled>
                            Trang trước
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg h-9 px-4 font-semibold text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all" disabled>
                            Trang kế
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
