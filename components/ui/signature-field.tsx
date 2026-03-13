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
    const [mode, setMode] = React.useState<'draw' | 'upload'>('draw')
    const fileInputRef = React.useRef<HTMLInputElement>(null)

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
            
            // If there's an existing value (base64), draw it on the canvas
            if (value && value.startsWith('data:image')) {
                const img = new Image()
                img.onload = () => {
                    const ctx = canvas.getContext('2d')
                    if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                }
                img.src = value
            }
        }
    }, [mode, open])

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
                    Tải ảnh lên
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
                    <div className="flex flex-col items-center justify-center h-[150px] p-4">
                        {value && value.startsWith('data:image') ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img src={value} alt="Signature" className="max-h-full object-contain" />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onChange('')}
                                    className="absolute top-0 right-0 h-6 w-6 rounded-full bg-red-100 text-red-600"
                                >
                                    <Eraser className="w-3 h-3" />
                                </Button>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-2 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Upload className="w-8 h-8" />
                                <span className="text-xs">Nhấp để chọn ảnh chữ ký</span>
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
            <p className="text-[10px] text-gray-400 italic">
                * Chữ ký sẽ được lưu cùng hồ sơ khách hàng
            </p>
        </div>
    )
}
