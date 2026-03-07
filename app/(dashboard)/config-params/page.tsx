'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    FileText,
    BanknoteArrowDown,
    DollarSign,
    Calendar,
    Settings2,
    Plus,
    Search,
    ChevronRight,
    LayoutGrid
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ParamTable } from '@/components/config-params/param-table'

const CONFIG_GROUPS = [
    {
        id: 'client',
        title: 'Khách hàng',
        icon: Users,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        tables: [
            { id: 'config_client_status', name: 'Trạng thái' },
            { id: 'config_client_source', name: 'Nguồn khách' },
            { id: 'config_client_goal', name: 'Mục tiêu tập luyện' },
            { id: 'config_client_training_time', name: 'Thời gian tập' },
            { id: 'config_client_registration_type', name: 'Lộ trình đăng ký' }
        ]
    },
    {
        id: 'contract',
        title: 'Hợp đồng',
        icon: FileText,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        tables: [
            { id: 'config_contract_status', name: 'Trạng thái HĐ' },
            { id: 'config_contract_type', name: 'Phân loại HĐ' },
            { id: 'config_contract_source', name: 'Nguồn HĐ' },
            { id: 'config_contract_trainer_type', name: 'Hình thức HLV' }
        ]
    },
    {
        id: 'expense',
        title: 'Chi phí',
        icon: BanknoteArrowDown,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        tables: [
            { id: 'config_expense_status', name: 'Trạng thái chi' }
        ]
    },
    {
        id: 'finance',
        title: 'Tài chính',
        icon: DollarSign,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        tables: [
            { id: 'config_finance_expense_type', name: 'Phân loại Chi' },
            { id: 'config_finance_income_type', name: 'Phân loại Thu' },
            { id: 'config_finance_payment_method', name: 'Hình thức thanh toán' },
            { id: 'config_finance_bank_account', name: 'Tài khoản ngân hàng' },
            { id: 'config_finance_ewallet', name: 'Ví điện tử' }
        ]
    },
    {
        id: 'event',
        title: 'Sự kiện',
        icon: Calendar,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        tables: [
            { id: 'config_event_group', name: 'Nhóm sự kiện' }
        ]
    }
]

export default function ConfigParamsPage() {
    const [selectedGroupId, setSelectedGroupId] = React.useState('client')
    const [selectedTableId, setSelectedTableId] = React.useState('config_client_status')
    const [searchTerm, setSearchTerm] = React.useState('')

    const selectedGroup = CONFIG_GROUPS.find(g => g.id === selectedGroupId)
    const selectedTable = selectedGroup?.tables.find(t => t.id === selectedTableId)

    const handleGroupSelect = (groupId: string) => {
        const group = CONFIG_GROUPS.find(g => g.id === groupId)
        setSelectedGroupId(groupId)
        if (group && group.tables.length > 0) {
            setSelectedTableId(group.tables[0].id)
        }
    }

    return (
        <div className="space-y-6 pb-10 font-inter">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Settings2 className="w-8 h-8 text-red-500" />
                        Tham số hệ thống
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">
                        Quản lý các thông số cấu hình và danh mục dùng chung.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Navigation: Groups */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 px-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Nhóm dữ liệu
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {CONFIG_GROUPS.map((group) => {
                            const Icon = group.icon
                            const isActive = selectedGroupId === group.id
                            return (
                                <button
                                    key={group.id}
                                    onClick={() => handleGroupSelect(group.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left border-2",
                                        isActive
                                            ? "bg-white dark:bg-gray-800 border-red-100 dark:border-red-900 shadow-sm"
                                            : "bg-gray-50/50 dark:bg-gray-900/50 border-transparent hover:bg-white dark:hover:bg-gray-800 hover:border-gray-100 dark:hover:border-gray-800"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", group.bg)}>
                                        <Icon className={cn("w-5 h-5", group.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn("text-sm font-semibold truncate", isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400")}>
                                            {group.title}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">
                                            {group.tables.length} tham số
                                        </div>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 text-red-500" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Right Content: Sub-navigation & Table */}
                <div className="lg:col-span-9 space-y-6">
                    {selectedGroup && (
                        <div className="flex flex-wrap gap-2">
                            {selectedGroup.tables.map((table) => (
                                <button
                                    key={table.id}
                                    onClick={() => setSelectedTableId(table.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                        selectedTableId === table.id
                                            ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-800"
                                    )}
                                >
                                    {table.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-white dark:bg-gray-900">
                        <CardHeader className="border-b border-gray-50 dark:border-gray-800/50 px-6 py-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", selectedGroup?.bg)}>
                                            <LayoutGrid className={cn("w-4 h-4", selectedGroup?.color)} />
                                        </div>
                                        {selectedTable?.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Danh sách các giá trị cấu hình cho mục {selectedTable?.name}.
                                    </CardDescription>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative group flex-1 md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                        <Input
                                            placeholder="Tìm kiếm..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 h-10 rounded-xl border-gray-100 dark:border-gray-800 focus:ring-red-500 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ParamTable
                                tableName={selectedTableId}
                                searchTerm={searchTerm}
                                groupColor={selectedGroup?.color || 'text-red-600'}
                                groupBg={selectedGroup?.bg || 'bg-red-50'}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
