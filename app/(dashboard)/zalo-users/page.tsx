'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    Building2,
    Shield,
    Trash,
    UserCircle,
    MoreVertical,
    FileDown,
    ChevronDown,
    XCircle,
    CheckCircle2,
    Star,
    MessageSquare,
    UserStar
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
import { fetchZaloUsers, bulkDeleteZaloUsers } from '@/app/actions/zalo-users'
import * as XLSX from 'xlsx'

import { ZaloUserDetailsSheet } from '@/components/zalo-users/zalo-user-details-sheet'

export default function ZaloUsersPage() {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedUser, setSelectedUser] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

    // Filter states
    const [filterUserType, setFilterUserType] = React.useState('all')
    const [filterFollowing, setFilterFollowing] = React.useState('all')

    const { data: zaloUsers, isLoading, refetch } = useQuery({
        queryKey: ['zalo-users'],
        queryFn: async () => {
            const result = await fetchZaloUsers()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const userTypes = React.useMemo(() => {
        if (!zaloUsers) return []
        const types = new Set(zaloUsers.map(u => u.user_type).filter(Boolean))
        return Array.from(types).sort()
    }, [zaloUsers])

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
        if (confirm('Bạn có chắc chắn muốn xóa Zalo user này?')) {
            const result = await bulkDeleteZaloUsers([id])
            if (!result.success) {
                toast.error('Lỗi khi xóa: ' + result.error)
            } else {
                toast.success('Đã xóa Zalo user thành công')
                refetch()
            }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} Zalo user đã chọn?`)) {
            const result = await bulkDeleteZaloUsers(selectedRows)
            if (!result.success) {
                toast.error('Lỗi khi xóa hàng loạt: ' + result.error)
            } else {
                toast.success(`Đã xóa thành công ${selectedRows.length} Zalo user`)
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
            'Tên hiển thị': u.display_name,
            'Zalo User ID': u.zalo_user_id,
            'Alias': u.alias,
            'Loại người dùng': u.user_type,
            'Đang quan tâm': u.is_following ? 'Có' : 'Không',
            'Tương tác cuối': u.last_interaction_date ? new Date(u.last_interaction_date).toLocaleDateString('vi-VN') : '',
            'Tags': u.tags,
            'Ghi chú': u.notes
        }))

        const worksheet = XLSX.utils.json_to_sheet(dataToExport)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Zalo Users Lady Fit')
        XLSX.writeFile(workbook, `LadyFit_ZaloUsers_${new Date().toISOString().slice(0, 10)}.xlsx`)
        toast.success('Đã xuất file Excel thành công')
    }

    const filteredUsers = zaloUsers?.filter(user => {
        const matchesSearch =
            user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.zalo_user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.tags?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesUserType = filterUserType === 'all' || user.user_type === filterUserType
        const matchesFollowing = filterFollowing === 'all' || (filterFollowing === 'following' ? user.is_following : !user.is_following)

        return matchesSearch && matchesUserType && matchesFollowing
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
        setFilterUserType('all')
        setFilterFollowing('all')
        setSearchTerm('')
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto font-inter">
            <ZaloUserDetailsSheet
                user={selectedUser}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onSuccess={refetch}
            />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-gray-50 flex items-center gap-3">
                        <UserStar className="w-8 h-8 text-blue-600" />
                        Quản lý Zalo Users
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Quản lý danh sách người dùng tương tác qua Zalo OA của Lady Fit.</p>
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
                                    className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold px-4 transition-all"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <Button onClick={handleExport} variant="outline" className="rounded-xl h-12 px-6 font-semibold border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                        <FileDown className="w-4 h-4 mr-2 text-slate-500" />
                        Xuất Excel
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-2xl dark:shadow-none rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 transition-all duration-500">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20">
                    <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full xl:max-w-xs group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                placeholder="Tìm kiếm Zalo user..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm h-12 transition-all shadow-sm outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                            <Select value={filterUserType} onValueChange={setFilterUserType}>
                                <SelectTrigger className="w-full sm:w-[150px] rounded-xl border-2 border-slate-100 dark:border-slate-800 h-11 bg-white dark:bg-slate-900 text-xs font-medium">
                                    <SelectValue placeholder="Loại người dùng" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    {userTypes.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterFollowing} onValueChange={setFilterFollowing}>
                                <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-2 border-slate-100 dark:border-slate-800 h-11 bg-white dark:bg-slate-900 text-xs font-medium">
                                    <SelectValue placeholder="Trạng thái quan tâm" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="following">Đang quan tâm</SelectItem>
                                    <SelectItem value="unfollowing">Không quan tâm</SelectItem>
                                </SelectContent>
                            </Select>

                            {(filterUserType !== 'all' || filterFollowing !== 'all' || searchTerm !== '') && (
                                <Button
                                    variant="ghost"
                                    onClick={resetFilters}
                                    className="h-11 px-3 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Xóa lọc
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="w-14 pl-8">
                                    <Checkbox
                                        checked={selectedRows.length === (filteredUsers?.length || 0) && (filteredUsers?.length || 0) > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-slate-300 dark:border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm"
                                    />
                                </TableHead>
                                <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-xs py-7">Người dùng Zalo</TableHead>
                                <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-xs">Phân loại & Thẻ</TableHead>
                                <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-xs">Tương tác cuối</TableHead>
                                <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-xs">Trạng thái</TableHead>
                                <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-xs text-right pr-10">Tùy chọn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-96 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-14 h-14 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin shadow-inner" />
                                            <span className="text-slate-400 font-medium text-sm">Đang tải danh sách Zalo users...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-96 text-center">
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
                                            selectedRows.includes(user.id) && "bg-blue-50/20 dark:bg-blue-950/10"
                                        )}
                                    >
                                        <TableCell className="pl-8">
                                            <Checkbox
                                                checked={selectedRows.includes(user.id)}
                                                onCheckedChange={() => toggleRow(user.id)}
                                                className="rounded-lg border-slate-300 dark:border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm"
                                            />
                                        </TableCell>
                                        <TableCell className="py-7">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 font-bold text-sm ring-2 ring-transparent group-hover:ring-blue-100 dark:group-hover:ring-blue-900/40 transition-all overflow-hidden bg-cover bg-center shadow-sm" style={{ backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none' }}>
                                                    {!user.avatar_url && (user.display_name?.charAt(0) || 'U')}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-50 text-[15px] group-hover:text-blue-600 transition-colors">{user.display_name}</span>
                                                        {user.is_sensitive && <Shield className="w-3.5 h-3.5 text-rose-500" />}
                                                    </div>
                                                    <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">ID: {user.zalo_user_id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{user.user_type || 'Chưa định nghĩa'}</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.tags?.split(',').map((tag: string, i: number) => (
                                                        <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">
                                                            {tag.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[13px] text-slate-600 dark:text-slate-300 font-medium">
                                                    {user.last_interaction_date ? new Date(user.last_interaction_date).toLocaleDateString('vi-VN') : '-'}
                                                </span>
                                                {user.alias && <span className="text-[11px] text-slate-400 italic">"{user.alias}"</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold shadow-sm",
                                                user.is_following
                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                    : "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", user.is_following ? "bg-emerald-600" : "bg-slate-400")} />
                                                {user.is_following ? 'Đang quan tâm' : 'Bỏ quan tâm'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-all"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setIsDetailsOpen(true)
                                                    }}
                                                    className="h-9 w-9 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(user.id)}
                                                    className="h-9 w-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-50 dark:border-slate-800">
                        Hiển thị <span className="font-bold text-slate-900 dark:text-white px-1">{filteredUsers?.length || 0}</span> người dùng Zalo
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="rounded-xl h-11 px-8 font-semibold text-xs text-slate-400 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 disabled:opacity-30" disabled>
                            Trang trước
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl h-11 px-8 font-semibold text-xs text-slate-400 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 disabled:opacity-30" disabled>
                            Trang kế
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
