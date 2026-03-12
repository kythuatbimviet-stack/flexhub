'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Printer, ArrowLeft, Settings2, RefreshCw, Download,
    Mail, Send, X, ChevronDown, ChevronUp, LayoutTemplate, Type,
    AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchContractById } from '@/app/actions/contracts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    parsePrintHFConfig, PRINT_FONTS, DEFAULT_HEADER_CONFIG, DEFAULT_FOOTER_CONFIG,
    type PrintHeaderConfig, type PrintFooterConfig, type TextAlign,
} from '@/lib/contract-print-types'

// Local alias for brevity
type HeaderConfig = PrintHeaderConfig
type FooterConfig = PrintFooterConfig

interface Margins { top: number; right: number; bottom: number; left: number }

// ── CSS + HTML injection ──────────────────────────────────────────────────────
const GOOGLE_FONTS_LINK = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700;800&family=Playfair+Display:wght@400;700;800&family=Play:wght@400;700&display=swap" rel="stylesheet">
`

function buildHeaderFooterInjection(
    header: HeaderConfig,
    footer: FooterConfig,
    margins: Margins
): { css: string; bodyHtml: string } {
    const HEADER_H = header.enabled ? 74 : 0
    const FOOTER_H = footer.enabled ? 38 : 0
    let css = ''
    let bodyHtml = ''

    if (header.enabled) {
        css += `
.print-header {
    position: fixed; top: 0; left: 0; right: 0; height: ${HEADER_H}px;
    display: flex; align-items: center; gap: 14px;
    padding: 8px 24px;
    border-bottom: 1.5px solid #e5e7eb;
    background: #fff; z-index: 200;
    font-family: '${header.fontFamily}', serif;
}
.print-header-logo {
    width: 54px; height: 54px; min-width: 54px; border-radius: 50%;
    background: linear-gradient(135deg,#e53e3e,#f87171);
    overflow: hidden; display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 22px; font-weight: 900;
    box-shadow: 0 2px 8px rgba(229,62,62,.25);
}
.print-header-logo img { width: 100%; height: 100%; object-fit: cover; }
.print-header-content {
    flex: 1;
    text-align: ${header.textAlign};
}
.print-header-title {
    font-size: ${header.titleSize}px; font-weight: 800;
    color: ${header.titleColor}; text-transform: uppercase; letter-spacing: .04em;
}
.print-header-sub {
    font-size: ${header.subSize}px; font-weight: 700;
    color: ${header.subColor}; margin-top: 2px;
}
.print-header-addr {
    font-size: ${header.addrSize}px; color: ${header.addrColor}; margin-top: 1px;
}
`
        const logoInner = header.logoUrl
            ? `<img src="${header.logoUrl}" alt="logo"/>`
            : `<span>${(header.centerName || header.title || 'G')[0].toUpperCase()}</span>`

        bodyHtml += `
<div class="print-header">
  <div class="print-header-logo">${logoInner}</div>
  <div class="print-header-content">
    <div class="print-header-title">${header.title}</div>
    ${header.centerName ? `<div class="print-header-sub">${header.centerName}</div>` : ''}
    ${header.address ? `<div class="print-header-addr">${header.address}</div>` : ''}
  </div>
</div>`
    }

    if (footer.enabled) {
        const parts: string[] = []
        if (footer.hotline) parts.push(`Hotline: ${footer.hotline}`)
        if (footer.email) parts.push(footer.email)
        const leftText = parts.join(' &nbsp;|&nbsp; ')

        css += `
.print-footer {
    position: fixed; bottom: 0; left: 0; right: 0; height: ${FOOTER_H}px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px;
    border-top: 1.5px solid #e5e7eb;
    background: #fff; z-index: 200;
    font-family: '${footer.fontFamily}', serif;
    font-size: ${footer.fontSize}px; color: ${footer.color};
}
.print-footer-info {
    flex: 1;
    text-align: ${footer.textAlign};
}
.print-footer-pagenum {
    background: #f3f4f6; padding: 3px 12px; border-radius: 4px;
    font-weight: 700; color: ${footer.color};
    margin-left: 14px;
}
`
        const pagerHtml = footer.showPageNumber
            ? `<div class="print-footer-pagenum">Trang 1</div>` : ''

        bodyHtml += `
<div class="print-footer">
  <div class="print-footer-info">${leftText}</div>
  ${pagerHtml}
</div>`
    }

    if (HEADER_H > 0 || FOOTER_H > 0) {
        css += `
.page {
    padding-top: calc(${margins.top}cm + ${HEADER_H}px) !important;
    padding-bottom: calc(${margins.bottom}cm + ${FOOTER_H}px) !important;
}
`
    }

    return { css, bodyHtml }
}

// ── PDF: build special HTML with header/footer as static blocks (not fixed) ──
function buildPdfHTML(
    baseHTML: string,
    header: HeaderConfig,
    footer: FooterConfig,
    margins: Margins
): string {
    const HEADER_H = header.enabled ? 74 : 0
    const FOOTER_H = footer.enabled ? 38 : 0
    let headerHtml = ''
    let footerHtml = ''
    let extraCss = ''

    if (header.enabled) {
        extraCss += `
.pdf-header {
    width: 100%; display: flex; align-items: center; gap: 14px;
    padding: 8px 24px; border-bottom: 1.5px solid #e5e7eb;
    background: #fff; box-sizing: border-box;
    font-family: '${header.fontFamily}', serif;
    height: ${HEADER_H}px;
}
.pdf-header-logo {
    width: 54px; height: 54px; min-width: 54px; border-radius: 50%;
    background: linear-gradient(135deg,#e53e3e,#f87171);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 22px; font-weight: 900;
}
.pdf-header-logo img { width:100%; height:100%; object-fit:cover; }
.pdf-header-info {
    flex: 1;
    text-align: ${header.textAlign};
}
.pdf-header-title { font-size:${header.titleSize}px; font-weight:800; color:${header.titleColor}; text-transform:uppercase; }
.pdf-header-sub   { font-size:${header.subSize}px; font-weight:700; color:${header.subColor}; margin-top:2px; }
.pdf-header-addr  { font-size:${header.addrSize}px; color:${header.addrColor}; margin-top:1px; }
`
        const logoInner = header.logoUrl
            ? `<img src="${header.logoUrl}" alt="logo"/>`
            : `<span>${(header.centerName || header.title || 'G')[0].toUpperCase()}</span>`

        headerHtml = `<div class="pdf-header">
  <div class="pdf-header-logo">${logoInner}</div>
  <div class="pdf-header-info">
    <div class="pdf-header-title">${header.title}</div>
    ${header.centerName ? `<div class="pdf-header-sub">${header.centerName}</div>` : ''}
    ${header.address ? `<div class="pdf-header-addr">${header.address}</div>` : ''}
  </div>
</div>`
    }

    if (footer.enabled) {
        const parts: string[] = []
        if (footer.hotline) parts.push(`Hotline: ${footer.hotline}`)
        if (footer.email) parts.push(footer.email)
        extraCss += `
.pdf-footer {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; border-top: 1.5px solid #e5e7eb;
    background: #fff; box-sizing: border-box;
    font-family: '${footer.fontFamily}', serif;
    font-size: ${footer.fontSize}px; color: ${footer.color};
    height: ${FOOTER_H}px;
}
.pdf-footer-info { flex: 1; text-align: ${footer.textAlign}; }
.pdf-footer-num { background:#f3f4f6; padding:3px 12px; border-radius:4px; font-weight:700; margin-left: 14px; }
`
        footerHtml = `<div class="pdf-footer">
  <div class="pdf-footer-info">${parts.join(' &nbsp;|&nbsp; ')}</div>
  ${footer.showPageNumber ? '<div class="pdf-footer-num">Trang 1</div>' : ''}
</div>`
    }

    // Override .page padding to add space for static header/footer
    extraCss += `
.page {
    padding-top: calc(${margins.top}cm + ${HEADER_H}px) !important;
    padding-bottom: calc(${margins.bottom}cm + ${FOOTER_H}px) !important;
}
/* Remove fixed positioning from preview HF so they don't duplicate */
.print-header, .print-footer { display: none !important; }
`

    // Wrap the original .page in a layout that includes pdf-header and pdf-footer
    const modified = baseHTML
        .replace('</style>', `${extraCss}</style>`)
        .replace('<body>', `<body>${headerHtml}`)
        .replace('</body>', `${footerHtml}</body>`)
    return modified
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ContractPrintPage() {
    const rawId = useParams<{ id: string }>().id
    const id = decodeURIComponent(rawId)
    const router = useRouter()

    const [contract, setContract] = React.useState<any>(null)
    const [templateContent, setTemplateContent] = React.useState<string | null>(null)
    const [placeholders, setPlaceholders] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [margins, setMargins] = React.useState<Margins>({ top: 2, bottom: 2, left: 2, right: 2 })

    const [headerConfig, setHeaderConfig] = React.useState<HeaderConfig>({
        ...DEFAULT_HEADER_CONFIG,
        title: 'HỢP ĐỒNG DỊCH VỤ HUẤN LUYỆN VIÊN CÁ NHÂN',
    })
    const [footerConfig, setFooterConfig] = React.useState<FooterConfig>({
        ...DEFAULT_FOOTER_CONFIG,
    })

    const [marginOpen, setMarginOpen] = React.useState(false)
    const [hfOpen, setHfOpen] = React.useState(true)
    const [hfTypoOpen, setHfTypoOpen] = React.useState(false)

    const [exportingPdf, setExportingPdf] = React.useState(false)
    const [emailOpen, setEmailOpen] = React.useState(false)
    const [emailTo, setEmailTo] = React.useState('')
    const [emailSubject, setEmailSubject] = React.useState('')
    const [emailBody, setEmailBody] = React.useState('')
    const [sendingEmail, setSendingEmail] = React.useState(false)

    const iframeRef = React.useRef<HTMLIFrameElement>(null)

    React.useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const [contractRes, , placeholderRes] = await Promise.all([
                    fetchContractById(id),
                    fetchActiveTemplateForBranch(undefined),
                    fetchAllPlaceholders(),
                ])
                if (!contractRes.success || !contractRes.data) {
                    setError(`Không tìm thấy hợp đồng (ID: ${id})`)
                    return
                }
                const c = contractRes.data
                setContract(c)
                if (placeholderRes.success) setPlaceholders(placeholderRes.data || [])
                const tRes = await fetchActiveTemplateForBranch(c.branch_id)
                if (tRes.success && tRes.data) {
                    setTemplateContent(tRes.data.content)
                    const hf = parsePrintHFConfig(tRes.data.header_footer_config)
                    
                    const branch = c.branches
                    setHeaderConfig({
                        ...hf.header,
                        centerName: hf.header.centerName || branch?.name || c.facility_name || c.short_name || '',
                        address: hf.header.address || branch?.center_address || c.address || '',
                    })
                    setFooterConfig({
                        ...hf.footer,
                        hotline: hf.footer.hotline || branch?.center_phone || c.center_phone || '',
                        email: hf.footer.email || branch?.email || '',
                    })
                } else {
                    setTemplateContent(null)
                    const branch = c.branches
                    setHeaderConfig(prev => ({
                        ...prev,
                        centerName: branch?.name || c.facility_name || c.short_name || '',
                        address: branch?.center_address || c.address || '',
                    }))
                    setFooterConfig(prev => ({
                        ...prev,
                        hotline: branch?.center_phone || c.center_phone || '',
                        email: branch?.email || '',
                    }))
                }

                setEmailTo(c.email || '')
                setEmailSubject(`Hợp đồng dịch vụ - ${c.member_name || ''} (${c.id || ''})`)
                setEmailBody(`Kính gửi ${c.member_name || 'Quý khách'},\n\nVui lòng xem và xác nhận nội dung hợp đồng.\n\nTrân trọng.`)
            } catch (e: any) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const getBaseHTML = React.useCallback(() => {
        if (!contract) return ''
        return (templateContent && templateContent.trim())
            ? getContractHTMLFromTemplate(contract, templateContent, placeholders)
            : getContractHTML(contract)
    }, [contract, templateContent, placeholders])

    // Preview HTML: uses position:fixed header/footer
    const getPreviewHTML = React.useCallback(() => {
        const base = getBaseHTML()
        if (!base) return ''
        const { css: hfCss, bodyHtml: hfBody } = buildHeaderFooterInjection(headerConfig, footerConfig, margins)
        const injected = `
  @page { margin: ${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm; }
  .page { padding: ${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm !important; }
  ${hfCss}
  </style>`
        return base
            .replace('<head>', '<head>' + GOOGLE_FONTS_LINK)
            .replace('</style>', injected)
            .replace('<body>', `<body>\n${hfBody}\n`)
    }, [getBaseHTML, headerConfig, footerConfig, margins])

    // PDF HTML: uses static (non-fixed) header/footer so html2canvas captures them
    const getPdfHTML = React.useCallback(() => {
        const base = getBaseHTML()
        if (!base) return ''
        // Apply margin override to base first
        const withMargins = base.replace('</style>',
            `@page { margin: ${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm; }
  .page { padding: ${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm !important; }
  </style>`)
        return buildPdfHTML(withMargins.replace('<head>', '<head>' + GOOGLE_FONTS_LINK), headerConfig, footerConfig, margins)
    }, [getBaseHTML, headerConfig, footerConfig, margins])

    const handlePrint = () => {
        const html = getPreviewHTML()
        if (!html) return
        const w = window.open('', '_blank', 'width=1000,height=800')
        if (!w) return
        w.document.write(html)
        w.document.close()
        w.onload = () => setTimeout(() => w.print(), 400)
    }

    // PDF export: render the static-header PDF HTML in a hidden iframe, then capture
    const handleExportPDF = async () => {
        setExportingPdf(true)
        try {
            const pdfHtml = getPdfHTML()
            if (!pdfHtml) { toast.error('Không thể tạo HTML'); return }

            // Create a temporary hidden iframe for PDF rendering
            const tempIframe = document.createElement('iframe')
            tempIframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;visibility:hidden;'
            document.body.appendChild(tempIframe)
            tempIframe.contentDocument!.write(pdfHtml)
            tempIframe.contentDocument!.close()

            // Wait for iframe to finish loading
            await new Promise<void>(resolve => {
                const check = () => {
                    if (tempIframe.contentDocument?.readyState === 'complete') resolve()
                    else setTimeout(check, 100)
                }
                setTimeout(check, 300)
            })

            const targetEl = tempIframe.contentDocument!.body as HTMLElement

            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import('html2canvas'), import('jspdf'),
            ])

            const canvas = await html2canvas(targetEl, {
                scale: 2, useCORS: true, allowTaint: false,
                backgroundColor: '#ffffff', logging: false,
                width: 794, windowWidth: 794,
            })

            document.body.removeChild(tempIframe)

            const imgData = canvas.toDataURL('image/jpeg', 0.95)
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
            const pw = pdf.internal.pageSize.getWidth()
            const ph = pdf.internal.pageSize.getHeight()
            const imgH = (canvas.height / canvas.width) * pw
            let y = 0
            while (y < imgH) {
                if (y > 0) pdf.addPage()
                pdf.addImage(imgData, 'JPEG', 0, -y, pw, imgH)
                y += ph
            }
            const fname = `hop-dong-${(contract?.id || 'export').replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
            pdf.save(fname)
            toast.success(`Đã xuất: ${fname}`)
        } catch (e: any) {
            toast.error('Lỗi xuất PDF: ' + e.message)
        } finally {
            setExportingPdf(false)
        }
    }

    const handleSendEmail = async () => {
        if (!emailTo) { toast.error('Vui lòng nhập email'); return }
        setSendingEmail(true)
        try {
            const result = await sendContractEmail({
                to: emailTo, subject: emailSubject,
                html: `<p style="font-family:Arial;font-size:14px;white-space:pre-line;">${emailBody.replace(/\n/g, '<br/>')}</p>`,
                contractId: contract?.id, memberName: contract?.member_name,
            })
            if (result.method === 'mailto' && result.mailtoUrl) {
                window.open(result.mailtoUrl, '_blank')
                toast.success('Đã mở ứng dụng email')
                setEmailOpen(false)
            } else if (result.success) {
                toast.success(`Đã gửi email tới ${emailTo}`)
                setEmailOpen(false)
            } else {
                toast.error('Lỗi: ' + result.error)
            }
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSendingEmail(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="text-sm">Đang tải hợp đồng...</p>
            </div>
        </div>
    )

    if (error || !contract) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center space-y-3">
                <p className="text-red-500 font-medium">{error || 'Lỗi tải dữ liệu'}</p>
                <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
            </div>
        </div>
    )

    const previewHTML = getPreviewHTML()

    // ── Sub-components ─────────────────────────────────────────────────────
    const SidebarSection = ({ title, icon: Icon, iconColor = 'text-blue-500', open, onToggle, children }: any) => (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50/80 hover:bg-gray-100 transition-colors">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} /> {title}
                </span>
                {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            {open && <div className="px-3 py-3 space-y-3">{children}</div>}
        </div>
    )

    const Toggle = ({ checked, onChange, label, activeColor = 'bg-blue-500' }: any) => (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div onClick={() => onChange(!checked)} className={`w-9 h-5 rounded-full transition-all relative ${checked ? activeColor : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-[12px] text-gray-700 font-medium">{label}</span>
        </label>
    )

    const SmallInput = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
        <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</Label>
            <Input type={type} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                placeholder={placeholder} className="h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white" />
        </div>
    )

    const FontSelect = ({ label, value, onChange }: any) => (
        <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</Label>
            <select value={value} onChange={e => onChange(e.target.value)}
                className="w-full h-8 text-xs rounded-lg border border-gray-200 bg-gray-50 px-2 focus:outline-none focus:ring-1 focus:ring-blue-300">
                {PRINT_FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>
        </div>
    )

    const ColorSizeRow = ({ colorLabel, colorValue, onColorChange, sizeLabel, sizeValue, onSizeChange }: any) => (
        <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-gray-400 uppercase">{colorLabel}</Label>
                <div className="flex items-center gap-1.5 h-8 border border-gray-200 rounded-lg bg-gray-50 px-2">
                    <input type="color" value={colorValue} onChange={e => onColorChange(e.target.value)}
                        className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent p-0" />
                    <span className="text-[10px] text-gray-500 font-mono">{colorValue}</span>
                </div>
            </div>
            <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-gray-400 uppercase">{sizeLabel}</Label>
                <Input type="number" min={8} max={24} value={sizeValue} onChange={e => onSizeChange(Number(e.target.value))}
                    className="h-8 text-xs rounded-lg border-gray-200 text-center" />
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex">
            {/* Preview */}
            <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">Xem trước tài liệu</p>
                <div className="w-full max-w-[794px]">
                    <div className="bg-white shadow-2xl rounded-md overflow-hidden" style={{ minHeight: '1123px' }}>
                        <iframe ref={iframeRef} srcDoc={previewHTML}
                            className="w-full border-none" style={{ minHeight: '1200px', height: '100%' }}
                            title="Xem trước hợp đồng" />
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-[275px] shrink-0 bg-white border-l border-gray-200 shadow-xl flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-sm text-gray-800">Cấu hình trang in</span>
                    </div>
                    <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <p className="font-semibold text-gray-800 truncate">{contract.member_name}</p>
                        <p className="text-gray-400 truncate text-[10px]">{contract.id}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${templateContent ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                            {templateContent ? '● Mẫu tùy chỉnh' : '● Mẫu mặc định'}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">

                    {/* Header & Footer */}
                    <SidebarSection title="Header & Footer" icon={LayoutTemplate} iconColor="text-purple-500"
                        open={hfOpen} onToggle={() => setHfOpen(v => !v)}>

                        {/* — HEADER — */}
                        <div className="pb-3 border-b border-dashed border-gray-200 space-y-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Header</p>
                            <Toggle checked={headerConfig.enabled}
                                onChange={(v: boolean) => setHeaderConfig(p => ({ ...p, enabled: v }))}
                                label="Hiển thị Header" activeColor="bg-purple-500" />
                            {headerConfig.enabled && (
                                <div className="ml-1 border-l-2 border-purple-100 pl-2.5 space-y-2.5">
                                    <div className="flex items-center gap-1 border border-gray-100 rounded-lg p-0.5 w-fit">
                                        {[
                                            { val: 'left', icon: AlignLeft },
                                            { val: 'center', icon: AlignCenter },
                                            { val: 'right', icon: AlignRight }
                                        ].map(t => {
                                            const Icon = t.icon
                                            return (
                                                <button key={t.val} onClick={() => setHeaderConfig(p => ({ ...p, textAlign: t.val as any }))}
                                                    className={cn('p-1.5 rounded-lg transition-colors',
                                                        headerConfig.textAlign === t.val ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-100')}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <SmallInput label="Logo URL (tùy chọn)" value={headerConfig.logoUrl}
                                        onChange={(v: string) => setHeaderConfig(p => ({ ...p, logoUrl: v }))} placeholder="https://..." />
                                    <SmallInput label="Tiêu đề HĐ" value={headerConfig.title}
                                        onChange={(v: string) => setHeaderConfig(p => ({ ...p, title: v }))} placeholder="HỢP ĐỒNG DỊCH VỤ..." />
                                    <SmallInput label="Tên trung tâm" value={headerConfig.centerName}
                                        onChange={(v: string) => setHeaderConfig(p => ({ ...p, centerName: v }))} placeholder="LADYFITS" />
                                    <SmallInput label="Địa chỉ" value={headerConfig.address}
                                        onChange={(v: string) => setHeaderConfig(p => ({ ...p, address: v }))} placeholder="Địa chỉ chi nhánh" />
                                </div>
                            )}
                        </div>

                        {/* — FOOTER — */}
                        <div className="pb-3 border-b border-dashed border-gray-200 space-y-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Footer</p>
                            <Toggle checked={footerConfig.enabled}
                                onChange={(v: boolean) => setFooterConfig(p => ({ ...p, enabled: v }))}
                                label="Hiển thị Footer" activeColor="bg-rose-500" />
                            {footerConfig.enabled && (
                                <div className="ml-1 border-l-2 border-rose-100 pl-2.5 space-y-2.5">
                                    <div className="flex items-center gap-1 border border-gray-100 rounded-lg p-0.5 w-fit">
                                        {[
                                            { val: 'left', icon: AlignLeft },
                                            { val: 'center', icon: AlignCenter },
                                            { val: 'right', icon: AlignRight }
                                        ].map(t => {
                                            const Icon = t.icon
                                            return (
                                                <button key={t.val} onClick={() => setFooterConfig(p => ({ ...p, textAlign: t.val as any }))}
                                                    className={cn('p-1.5 rounded-lg transition-colors',
                                                        footerConfig.textAlign === t.val ? 'bg-rose-100 text-rose-700' : 'text-gray-400 hover:bg-gray-100')}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <SmallInput label="Hotline" value={footerConfig.hotline}
                                        onChange={(v: string) => setFooterConfig(p => ({ ...p, hotline: v }))} placeholder="0832 646 686" />
                                    <SmallInput label="Email" value={footerConfig.email}
                                        onChange={(v: string) => setFooterConfig(p => ({ ...p, email: v }))} placeholder="kinhdoanh@..." />
                                    <Toggle checked={footerConfig.showPageNumber}
                                        onChange={(v: boolean) => setFooterConfig(p => ({ ...p, showPageNumber: v }))}
                                        label="Số trang (Trang 1)" activeColor="bg-rose-500" />
                                </div>
                            )}
                        </div>

                        {/* — TYPOGRAPHY (mở/đóng được) — */}
                        <div className="space-y-2">
                            <button onClick={() => setHfTypoOpen(v => !v)}
                                className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600">
                                <span className="flex items-center gap-1.5"><Type className="w-3 h-3" /> Kiểu chữ</span>
                                {hfTypoOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {hfTypoOpen && (
                                <div className="space-y-3 border-t border-gray-100 pt-2">
                                    {/* Header typography */}
                                    {headerConfig.enabled && (
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-300">Header</p>
                                            <FontSelect label="Font chữ" value={headerConfig.fontFamily}
                                                onChange={(v: string) => setHeaderConfig(p => ({ ...p, fontFamily: v }))} />
                                            <ColorSizeRow
                                                colorLabel="Màu tiêu đề" colorValue={headerConfig.titleColor}
                                                onColorChange={(v: string) => setHeaderConfig(p => ({ ...p, titleColor: v }))}
                                                sizeLabel="Cỡ (px)" sizeValue={headerConfig.titleSize}
                                                onSizeChange={(v: number) => setHeaderConfig(p => ({ ...p, titleSize: v }))} />
                                            <ColorSizeRow
                                                colorLabel="Màu tên TT" colorValue={headerConfig.subColor}
                                                onColorChange={(v: string) => setHeaderConfig(p => ({ ...p, subColor: v }))}
                                                sizeLabel="Cỡ (px)" sizeValue={headerConfig.subSize}
                                                onSizeChange={(v: number) => setHeaderConfig(p => ({ ...p, subSize: v }))} />
                                            <ColorSizeRow
                                                colorLabel="Màu địa chỉ" colorValue={headerConfig.addrColor}
                                                onColorChange={(v: string) => setHeaderConfig(p => ({ ...p, addrColor: v }))}
                                                sizeLabel="Cỡ (px)" sizeValue={headerConfig.addrSize}
                                                onSizeChange={(v: number) => setHeaderConfig(p => ({ ...p, addrSize: v }))} />
                                        </div>
                                    )}
                                    {/* Footer typography */}
                                    {footerConfig.enabled && (
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-rose-300">Footer</p>
                                            <FontSelect label="Font chữ" value={footerConfig.fontFamily}
                                                onChange={(v: string) => setFooterConfig(p => ({ ...p, fontFamily: v }))} />
                                            <ColorSizeRow
                                                colorLabel="Màu chữ" colorValue={footerConfig.color}
                                                onColorChange={(v: string) => setFooterConfig(p => ({ ...p, color: v }))}
                                                sizeLabel="Cỡ (px)" sizeValue={footerConfig.fontSize}
                                                onSizeChange={(v: number) => setFooterConfig(p => ({ ...p, fontSize: v }))} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </SidebarSection>

                    {/* Lề trang */}
                    <SidebarSection title="Lề trang (cm)" icon={Settings2} open={marginOpen} onToggle={() => setMarginOpen(v => !v)}>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'top', label: 'Trên' }, { key: 'right', label: 'Phải' },
                                { key: 'bottom', label: 'Dưới' }, { key: 'left', label: 'Trái' },
                            ].map(({ key, label }) => (
                                <div key={key} className="space-y-1">
                                    <Label className="text-[10px] font-semibold text-gray-400 uppercase">{label}</Label>
                                    <Input type="number" min={0} max={5} step={0.5}
                                        value={margins[key as keyof Margins]}
                                        onChange={e => setMargins(m => ({ ...m, [key]: parseFloat(e.target.value) || 0 }))}
                                        className="h-8 rounded-lg text-center font-bold text-sm border-gray-200" />
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setMargins({ top: 2, bottom: 2, left: 2, right: 2 })}
                            className="text-[10px] text-gray-400 hover:text-gray-600 underline underline-offset-2">
                            Đặt lại (2cm)
                        </button>
                    </SidebarSection>
                </div>

                {/* Actions */}
                <div className="px-4 pb-5 pt-3 space-y-2 border-t border-gray-100">
                    <Button onClick={handlePrint}
                        className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md">
                        <Printer className="w-4 h-4 mr-2" /> In phiếu
                    </Button>
                    <Button onClick={handleExportPDF} disabled={exportingPdf}
                        className="w-full h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md disabled:opacity-60">
                        <Download className="w-4 h-4 mr-2" />
                        {exportingPdf ? 'Đang xuất...' : 'Xuất PDF'}
                    </Button>
                    <Button onClick={() => setEmailOpen(true)} variant="outline"
                        className="w-full h-10 rounded-xl border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-bold text-sm">
                        <Mail className="w-4 h-4 mr-2" /> Gửi Email
                    </Button>
                    <button onClick={() => window.close()}
                        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 py-1">
                        <ArrowLeft className="w-3 h-3" /> Đóng trang này
                    </button>
                </div>
            </div>

            {/* Email Dialog */}
            {emailOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Gửi Email Hợp đồng</p>
                                    <p className="text-[11px] text-gray-400">Gửi nội dung HĐ cho khách hàng</p>
                                </div>
                            </div>
                            <button onClick={() => setEmailOpen(false)} className="text-gray-400 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Đến (Email khách)</Label>
                                <Input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)}
                                    placeholder="email@example.com" className="h-10 rounded-xl border-gray-200 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tiêu đề</Label>
                                <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                                    className="h-10 rounded-xl border-gray-200 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nội dung</Label>
                                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={4}
                                    className="w-full rounded-xl border border-gray-200 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                            </div>
                            <p className="text-[10px] text-gray-400 italic">💡 Chưa có RESEND_API_KEY → mở app email thủ công.</p>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setEmailOpen(false)}>Hủy</Button>
                            <Button onClick={handleSendEmail} disabled={sendingEmail || !emailTo}
                                className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-60">
                                <Send className="w-4 h-4 mr-2" />
                                {sendingEmail ? 'Đang gửi...' : 'Gửi ngay'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
