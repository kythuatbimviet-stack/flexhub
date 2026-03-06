'use client'

import React from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface WeightChartProps {
    data: any[]
}

export function WeightChart({ data }: WeightChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900 rounded-2xl h-[400px] flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có dữ liệu biểu đồ</p>
            </Card>
        )
    }

    // Sort data by date just in case
    const sortedData = [...data].sort((a, b) =>
        new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime()
    )

    const chartData = sortedData.map(item => ({
        date: format(new Date(item.measurement_date), 'dd/MM', { locale: vi }),
        fullDate: format(new Date(item.measurement_date), 'dd/MM/yyyy', { locale: vi }),
        weight: parseFloat(item.weight)
    }))

    return (
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-gray-900 transition-all duration-500">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">Xu hướng cân nặng</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#6b7280' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#6b7280' }}
                                domain={['dataMin - 2', 'dataMax + 2']}
                                unit="kg"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    padding: '12px'
                                }}
                                itemStyle={{ color: '#ef4444', fontSize: '12px' }}
                                labelStyle={{ color: '#374151', fontSize: '13px', marginBottom: '4px' }}
                                formatter={(value: number | undefined) => [`${value ?? 0} kg`, 'Cân nặng']}
                                labelFormatter={(label, payload) => {
                                    if (payload && payload[0]) {
                                        return payload[0].payload.fullDate;
                                    }
                                    return label;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="weight"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorWeight)"
                                animationDuration={1000}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
