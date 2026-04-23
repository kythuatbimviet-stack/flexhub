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
import { Phone, MessageSquare, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { BirthdayDetailsSheet } from './birthday-details-sheet'

interface ClientBirthdaysTableProps {
    data: any[]
}

export function ClientBirthdaysTable({ data }: ClientBirthdaysTableProps) {
    const [selectedPerson, setSelectedPerson] = React.useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

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
                        <TableHead className="w-[300px] text-slate-950 font-semibold pl-8">Khách hàng</TableHead>
                        <TableHead className="text-slate-950 font-semibold">ID</TableHead>
                        <TableHead className="text-slate-950 font-semibold">Ngày sinh</TableHead>
                        <TableHead className="text-slate-950 font-semibold">Chi nhánh</TableHead>
                        <TableHead className="text-slate-950 font-semibold">PT phụ trách</TableHead>
                        <TableHead className="text-right pr-8 text-slate-950 font-semibold">Thao tác</TableHead>
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
                                                <AvatarFallback className="bg-slate-100 text-slate-950 font-medium">
                                                    {person.member_name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-semibold text-black dark:text-white group-hover/name:text-red-600 transition-colors">
                                                {person.member_name}
                                            </span>
                                        </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-medium text-slate-950 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                        {person.id}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        {bday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        {person.branches?.name || 'Hệ thống'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        {person.pt_name || '-'}
                                    </span>
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
                                            className="h-9 w-9 rounded-xl hover:bg-emerald-50 text-emerald-600"
                                            onClick={() => window.open(`https://zalo.me/${person.phone}`, '_blank')}
                                        >
                                            <MessageSquare className="w-4 h-4" />
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
