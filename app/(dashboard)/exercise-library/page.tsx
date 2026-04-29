'use client'

import * as React from 'react'
import { ListChecks } from 'lucide-react'
import { ExerciseLibrary } from '@/components/training-plans/exercise-library'

export default function ExerciseLibraryPage() {
    return (
        <div className="space-y-6 font-inter pb-10">
            {/* Header */}
            <div className="flex flex-col gap-1 px-1">
                <h1 className="text-3xl font-medium text-black dark:text-white flex items-center gap-2 tracking-tight">
                    <ListChecks className="w-8 h-8 text-[#FD5771]" />
                    Danh mục bài tập
                </h1>
                <p className="text-sm text-black/60 dark:text-gray-400 font-normal tracking-tight">
                    Quản lý kho bài tập mẫu dùng để xây dựng giáo án tập luyện.
                </p>
            </div>

            {/* Exercise Library Component */}
            <ExerciseLibrary />
        </div>
    )
}
