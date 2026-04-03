'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { UserCheck, UserMinus, UserPlus, Activity } from 'lucide-react'

interface StatsProps {
    stats: {
        total: number
        y: number
        n: number
        td: number
    }
}

export function TrainingLogStats({ stats }: StatsProps) {
    const items = [
        {
            label: 'Tổng số buổi',
            value: stats.total,
            icon: Activity,
            color: 'text-black',
            bg: 'bg-gray-50/50',
            border: 'border-gray-100'
        },
        {
            label: 'Đã tập (Y)',
            value: stats.y,
            percent: stats.total > 0 ? Math.round((stats.y / stats.total) * 100) : 0,
            icon: UserCheck,
            color: 'text-blue-600',
            bg: 'bg-blue-50/30',
            border: 'border-blue-100/50'
        },
        {
            label: 'Nghỉ tập (N)',
            value: stats.n,
            percent: stats.total > 0 ? Math.round((stats.n / stats.total) * 100) : 0,
            icon: UserMinus,
            color: 'text-red-600',
            bg: 'bg-red-50/30',
            border: 'border-red-100/50'
        },
        {
            label: 'Tự tập (TĐ)',
            value: stats.td,
            percent: stats.total > 0 ? Math.round((stats.td / stats.total) * 100) : 0,
            icon: UserPlus,
            color: 'text-orange-600',
            bg: 'bg-orange-50/30',
            border: 'border-orange-100/50'
        }
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {items.map((item, idx) => (
                <Card key={idx} className={cn("border shadow-none rounded-2xl transition-all overflow-hidden", item.border, item.bg)}>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", item.color, "bg-white shadow-sm")}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12px] font-medium text-slate-900 mb-0.5 leading-none">
                                {item.label}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-medium text-black tracking-tight">
                                    {item.value}
                                </h3>
                                {item.percent !== undefined && (
                                    <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full", item.bg, item.color)}>
                                        {item.percent}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
