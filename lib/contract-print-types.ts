/**
 * Shared types for contract print header/footer configuration.
 * Used in both:
 *  - app/(dashboard)/contract-template/page.tsx  (editor)
 *  - app/(dashboard)/contracts/print/[id]/page.tsx (print preview)
 */

export const PRINT_FONTS = [
    'Times New Roman', 'Arial', 'Calibri', 'Georgia', 'Verdana', 'Helvetica',
    'Nunito Sans', 'Play', 'Playfair Display'
] as const

export type TextAlign = 'left' | 'center' | 'right'

export interface PrintHeaderConfig {
    enabled: boolean
    logoUrl: string
    title: string
    centerName: string
    address: string
    textAlign: TextAlign      // alignment of the text block beside logo
    fontFamily: string
    titleSize: number
    titleColor: string
    subSize: number
    subColor: string
    addrSize: number
    addrColor: string
}

export interface PrintFooterConfig {
    enabled: boolean
    hotline: string
    email: string
    showPageNumber: boolean
    textAlign: TextAlign      // alignment of the left-side footer text
    fontFamily: string
    fontSize: number
    color: string
}

export interface PrintHFConfig {
    header: PrintHeaderConfig
    footer: PrintFooterConfig
}

export const DEFAULT_HEADER_CONFIG: PrintHeaderConfig = {
    enabled: false,
    logoUrl: '',
    title: 'HỢP ĐỒNG DỊCH VỤ HUẤN LUYỆN VIÊN CÁ NHÂN',
    centerName: '',
    address: '',
    textAlign: 'left',
    fontFamily: 'Times New Roman',
    titleSize: 13,
    titleColor: '#1a202c',
    subSize: 11,
    subColor: '#374151',
    addrSize: 10,
    addrColor: '#6b7280',
}

export const DEFAULT_FOOTER_CONFIG: PrintFooterConfig = {
    enabled: false,
    hotline: '',
    email: '',
    showPageNumber: true,
    textAlign: 'left',
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#e53e3e',
}

export const DEFAULT_HF_CONFIG: PrintHFConfig = {
    header: DEFAULT_HEADER_CONFIG,
    footer: DEFAULT_FOOTER_CONFIG,
}

/** Safely parse a raw JSON value into PrintHFConfig, filling missing fields with defaults */
export function parsePrintHFConfig(raw: any): PrintHFConfig {
    if (!raw || typeof raw !== 'object') return DEFAULT_HF_CONFIG
    return {
        header: { ...DEFAULT_HEADER_CONFIG, ...(raw.header || {}) },
        footer: { ...DEFAULT_FOOTER_CONFIG, ...(raw.footer || {}) },
    }
}
