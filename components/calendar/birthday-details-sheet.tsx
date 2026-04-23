'use client'

import * as React from 'react'
import { 
    format 
} from 'date-fns'
import { 
    Cake, 
    Phone, 
    MessageSquare, 
    Building2, 
    User,
    X,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Sheet,
    SheetContent,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

interface BirthdayDetailsSheetProps {
    person: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function BirthdayDetailsSheet({ person, open, onOpenChange }: BirthdayDetailsSheetProps) {
    if (!person) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-[32px] h-[580px] p-0 border-none shadow-2xl overflow-hidden bg-slate-50 dark:bg-gray-950 px-0 z-[150]">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                
                <div className="px-6 pt-10 pb-28 flex flex-col h-full overflow-y-auto">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="relative mb-4">
                            <Avatar className="w-24 h-24 rounded-[32px] border-4 border-white dark:border-gray-800 shadow-xl shadow-red-100 dark:shadow-none">
                                <AvatarImage src={person?.avatar_url} className="object-cover" />
                                <AvatarFallback className="bg-red-600 text-white font-bold text-3xl">
                                    {person?.member_name?.charAt(0) || person?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-red-600 text-white p-2 rounded-2xl shadow-lg border-2 border-white dark:border-gray-800">
                                <Cake className="w-4 h-4" />
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-1">
                            {person?.member_name || person?.name}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 rounded-full px-3 py-0.5 font-medium text-[10px]">
                                {person?.id}
                            </Badge>
                            {person?.position ? (
                                <Badge variant="outline" className="text-red-600 border-red-100 dark:text-red-400 dark:border-red-900/30 rounded-full text-[10px]">
                                    {person.position}
                                </Badge>
                            ) : person?.pt_name && (
                                <Badge variant="outline" className="text-blue-600 border-blue-100 dark:text-blue-400 dark:border-blue-900/30 rounded-full text-[10px]">
                                    PT: {person.pt_name}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 bg-white dark:bg-gray-900 rounded-[32px] p-6 border border-slate-100 dark:border-gray-800 shadow-sm mb-8">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                                    <Cake className="w-4 h-4 text-orange-600" />
                                </div>
                                <span className="text-xs font-semibold text-slate-500">Ngày sinh</span>
                            </div>
                            <span className="text-sm font-bold text-red-600">
                                {person?.dob && format(new Date(person.dob), 'dd/MM/yyyy')}
                            </span>
                        </div>
                        
                        <Separator className="opacity-50" />
                        
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-xs font-semibold text-slate-500">Chi nhánh</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {person?.branches?.name || 'Hệ thống'}
                            </span>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="text-xs font-semibold text-slate-500">Số điện thoại</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {person?.phone || '-'}
                            </span>
                        </div>

                        {(person?.pt_name || person?.position) && (
                            <>
                                <Separator className="opacity-50" />
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
                                            <User className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500">
                                            {person?.position ? 'Chức vụ' : 'PT phụ trách'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {person?.position || person?.pt_name}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-auto flex gap-3">
                        <Button 
                            className="flex-1 h-14 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 font-bold active:scale-95 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                            onClick={() => window.open(`tel:${person?.phone}`)}
                        >
                            <Phone className="w-5 h-5 mr-2" /> Gọi điện
                        </Button>
                        <Button 
                            variant="outline"
                            className="flex-1 h-14 rounded-2xl border-emerald-100 dark:border-emerald-900/30 text-emerald-600 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 active:scale-95 transition-all"
                            onClick={() => window.open(`https://zalo.me/${person?.phone}`, '_blank')}
                        >
                            <MessageSquare className="w-5 h-5 mr-2" /> Zalo
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
