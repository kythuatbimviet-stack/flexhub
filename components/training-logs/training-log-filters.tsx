'use client'

import * as React from 'react'
import { Search, RotateCcw, Building2, UserCircle2, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FiltersProps {
    branches: any[]
    pts: string[]
    branchFilter: string
    setBranchFilter: (v: string) => void
    ptFilter: string
    setPtFilter: (v: string) => void
    clientSearch: string
    setClientSearch: (v: string) => void
    onClear: () => void
    canViewAllBranches: boolean
}

export function TrainingLogFilters({
    branches,
    pts,
    branchFilter,
    setBranchFilter,
    ptFilter,
    setPtFilter,
    clientSearch,
    setClientSearch,
    onClear,
    canViewAllBranches
}: FiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            {/* Client Search */}
            <div className="flex-[2] min-w-[280px]">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                    <Input 
                        placeholder="Tìm kiếm tên khách hàng..." 
                        value={clientSearch} 
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-10 h-10 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50 text-[13px] font-medium text-black dark:text-gray-200 focus:ring-red-500" 
                    />
                </div>
            </div>

            {/* Branch Filter */}
            <div className="flex-1 min-w-[180px]">
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="h-10 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50 text-[13px] font-medium text-black dark:text-gray-200">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <SelectValue placeholder="Chọn chi nhánh" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="all" className="text-[13px] font-medium">Tất cả chi nhánh</SelectItem>
                        {branches.map(b => (
                            <SelectItem key={b.id} value={b.id} className="text-[13px] font-medium">{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* PT Filter */}
            <div className="flex-1 min-w-[200px]">
                <Select value={ptFilter} onValueChange={setPtFilter}>
                    <SelectTrigger className="h-10 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50 text-[13px] font-medium text-black dark:text-gray-200">
                        <div className="flex items-center gap-2">
                            <UserCircle2 className="w-4 h-4 text-gray-400" />
                            <SelectValue placeholder="Chọn PT" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="all" className="text-[13px] font-medium">Tất cả PT</SelectItem>
                        {pts.map(pt => (
                            <SelectItem key={pt} value={pt} className="text-[13px] font-medium">{pt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Clear Button */}
            <Button 
                variant="ghost" 
                onClick={onClear}
                className="h-10 px-4 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium text-[13px] transition-all"
            >
                <RotateCcw className="w-4 h-4 mr-2" />
                Làm mới
            </Button>
        </div>
    )
}
