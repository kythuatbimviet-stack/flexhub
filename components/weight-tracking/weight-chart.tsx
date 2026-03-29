'use client'

import React from 'react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    Line
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
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Chưa có dữ liệu biểu đồ</p>
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
        weight: parseFloat(item.weight) || 0,
        target: parseFloat(item.target_weight) || null,
        height: parseFloat(item.height) || null
    }))

    return (
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none rounded-3xl overflow-hidden bg-white dark:bg-gray-950 transition-all duration-500 border border-slate-100 dark:border-slate-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-black dark:text-white tracking-tight font-inter">XU HƯỚNG CÂN NẶNG & CHỈ SỐ</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                                domain={['dataMin - 5', 'dataMax + 5']}
                                unit="kg"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid #f1f5f9',
                                    borderRadius: '16px',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
                                    padding: '12px'
                                }}
                                itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '2px 0' }}
                                labelStyle={{ color: '#000', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}
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
                                name="Thực tế"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorWeight)"
                                animationDuration={1000}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="target"
                                name="Cần đạt"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                
                {/* Legend / Key Info */}
                <div className="flex items-center gap-6 mt-6 ml-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Cân nặng thực tế</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500 border-t-2 border-dashed border-blue-500" />
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Mục tiêu (Cần đạt)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
