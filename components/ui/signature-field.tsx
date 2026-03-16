'use client'

import * as React from 'react'
import { Eraser, Upload, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SignatureFieldProps {
    value?: string
    onChange: (value: string) => void
    className?: string
}

export function SignatureField({ value, onChange, className }: SignatureFieldProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = React.useState(false)
    // Tự động chuyển sang 'upload' nếu value là một URL ảnh (không phải base64)
    const [mode, setMode] = React.useState<'draw' | 'upload'>(
        (value && !value.startsWith('data:image')) ? 'upload' : 'draw'
    )
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const isBase64 = value?.startsWith('data:image')
    const isUrl = value?.startsWith('http') || value?.startsWith('/')

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true)
        draw(e)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
        if (canvasRef.current) {
            onChange(canvasRef.current.toDataURL('image/png'))
        }
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
        const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top

        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#000'

        if (!isDrawing) {
            ctx.beginPath()
            ctx.moveTo(x, y)
        } else {
            ctx.lineTo(x, y)
            ctx.stroke()
        }
    }

    const clearCanvas = () => {
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            onChange('')
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64String = reader.result as string
                onChange(base64String)
            }
            reader.readAsDataURL(file)
        }
    }

    // Initialize canvas size on mount
    React.useEffect(() => {
        if (canvasRef.current && mode === 'draw') {
            const canvas = canvasRef.current
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            
            // If there's an existing base64 value, draw it
            if (isBase64) {
                const img = new Image()
                img.onload = () => {
                    const ctx = canvas.getContext('2d')
                    if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                }
                img.src = value!
            }
        }
    }, [mode, isBase64])

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center gap-2 mb-2">
                <Button
                    type="button"
                    variant={mode === 'draw' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('draw')}
                    className="rounded-lg h-8 text-[10px]"
                >
                    <Type className="w-3 h-3 mr-1" />
                    Ký trực tiếp
                </Button>
                <Button
                    type="button"
                    variant={mode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('upload')}
                    className="rounded-lg h-8 text-[10px]"
                >
                    <Upload className="w-3 h-3 mr-1" />
                    Tải ảnh lên / Preview
                </Button>
            </div>

            <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-gray-900 min-h-[150px]">
                {mode === 'draw' ? (
                    <>
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseOut={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-[150px] cursor-crosshair touch-none"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={clearCanvas}
                            className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm"
                        >
                            <Eraser className="w-4 h-4 text-gray-500" />
                        </Button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[150px] p-4 text-center">
                        {value ? (
                            <div className="relative w-full h-full flex items-center justify-center group">
                                <img 
                                    src={value} 
                                    alt="Signature Preview" 
                                    className="max-h-full max-w-full object-contain p-2"
                                    onError={(e: any) => {
                                        e.target.style.display = 'none'
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-xl">
                                     <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            onChange('')
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }}
                                        className="rounded-full h-8 px-4"
                                    >
                                        <Eraser className="w-3 h-3 mr-2" />
                                        Xóa chữ ký
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-2 cursor-pointer text-gray-400 hover:text-blue-500 transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <span className="text-[11px] font-medium uppercase tracking-wider">Nhấp để chọn ảnh chữ ký</span>
                                <span className="text-[10px] text-gray-400">Hỗ trợ định dạng PNG, JPG</span>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>
                )}
            </div>
            {mode === 'draw' && (
                <p className="text-[10px] text-gray-400 italic">
                    * Ký trực tiếp vào khung trên bằng chuột hoặc bút cảm ứng
                </p>
            )}
            {mode === 'upload' && !value && (
                <p className="text-[10px] text-gray-400 italic">
                    * Đính kèm ảnh chữ ký đã có (khuyên dùng ảnh nền trong suốt)
                </p>
            )}
        </div>
    )
}
