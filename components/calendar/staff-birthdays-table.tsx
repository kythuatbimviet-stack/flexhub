'use client'

import * as React from 'react'
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Phone, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { BirthdayDetailsSheet } from './birthday-details-sheet'

interface StaffBirthdaysTableProps {
    data: any[]
}

export function StaffBirthdaysTable({ data }: StaffBirthdaysTableProps) {
    const [selectedPerson, setSelectedPerson] = React.useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

    const getDaysUntil = (dob: string) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const birthDate = new Date(dob)
        const currentYear = today.getFullYear()
        
        // Create target date for this year
        let target = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())
        
        // If the date has passed this year, it might be for next year in some contexts,
        // but the user example says "Đã qua" if it's passed.
        
        if (target.getTime() === today.getTime()) {
            return <span className="text-blue-600 font-semibold">(Hôm nay)</span>
        }
        
        if (target < today) {
            return <span className="text-slate-400 font-normal">(Đã qua)</span>
        }
        
        const diffTime = target.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return <span className="text-blue-600 font-medium">(còn {diffDays} ngày)</span>
    }

    return (
        <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
        >
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-gray-100 dark:border-gray-800 h-14">
                        <TableHead className="w-[350px] text-black dark:text-white font-semibold pl-8">Nhân sự</TableHead>
                        <TableHead className="text-black dark:text-white font-semibold">Ngày sinh</TableHead>
                        <TableHead className="text-black dark:text-white font-semibold">Chi nhánh</TableHead>
                        <TableHead className="text-black dark:text-white font-semibold">Chức vụ / Phòng ban</TableHead>
                        <TableHead className="text-right pr-8 text-black dark:text-white font-semibold">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((person) => {
                        const bday = new Date(person.dob)
                        return (
                            <TableRow key={person.id} className="group border-gray-100 dark:border-gray-800 hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-4 pl-8">
                                        <div 
                                            className="flex items-center gap-3 cursor-pointer group/name"
                                            onClick={() => {
                                                setSelectedPerson(person)
                                                setIsSheetOpen(true)
                                            }}
                                        >
                                            <Avatar className="w-10 h-10 rounded-xl border border-slate-100 transition-transform group-hover/name:scale-110">
                                                <AvatarImage src={person.avatar_url} />
                                                <AvatarFallback className="bg-slate-100 text-black font-semibold">
                                                    {person.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-black dark:text-white group-hover/name:text-blue-600 transition-colors">
                                                    {person.name}
                                                </span>
                                                <span className="text-[11px] text-black/60 dark:text-white/60 font-medium">{person.email}</span>
                                            </div>
                                        </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-black dark:text-white">
                                            {bday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                        <span className="text-[11px]">
                                            {getDaysUntil(person.dob)}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        {person.branches?.name || 'Hệ thống'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-black dark:text-white">
                                            {person.position || 'Nhân sự'}
                                        </span>
                                        <span className="text-[11px] text-black/60 dark:text-white/60 font-medium">{person.department || '-'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-600"
                                            onClick={() => window.open(`tel:${person.phone}`)}
                                        >
                                            <Phone className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-slate-50 text-black"
                                            onClick={() => window.open(`mailto:${person.email}`)}
                                        >
                                            <Mail className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
            </motion.div>

            <BirthdayDetailsSheet 
                person={selectedPerson} 
                open={isSheetOpen} 
                onOpenChange={setIsSheetOpen} 
            />
        </>
    )
}
