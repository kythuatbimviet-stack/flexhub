# Kỹ thuật xuất file PDF Hợp đồng từ React Components

Tài liệu này tổng hợp phương pháp và kỹ thuật được sử dụng để xuất file PDF từ dữ liệu hợp đồng trên trình duyệt, ứng dụng các thư viện `jspdf` và `html2canvas`. Thay vì tạo chuỗi HTML thô hoặc vẽ thủ công từng dòng trên PDF, chúng ta tận dụng sức mạnh của React và CSS (Tailwind) để thiết kế một template trực quan, độ trễ thấp và dễ bảo trì.

## 1. Nguyên lý hoạt động

Quy trình (Workflow) xuất PDF hoạt động theo các bước sau:
1. **Dựng giao diện (Render):** Tạo ra một React Component chứa thiết kế của Hợp đồng/Văn bản dưới dạng HTML/CSS thuần túy. Component này được cấp các thông số hiển thị giống hệt khổ giấy A4.
2. **Ẩn khỏi người dùng (Hide):** Đặt Component này ở một vị trí khuất trên giao diện thực tế (ví dụ: `fixed left-[-9999px] top-0`) để người dùng không nhìn thấy, nhưng trình duyệt vẫn render DOM đầy đủ.
3. **Chụp ảnh (Screenshot):** Sử dụng `html2canvas` để quét và chụp lại phần tử DOM đó thành dạng canvas (hình ảnh đồ họa raterized).
4. **Nhúng vào PDF (Embed):** Chuyển đổi file canvas thành ảnh base64 (ví dụ: định dạng PNG), sau đó dùng `jspdf` để nhúng ảnh này vào một trang PDF chuẩn A4 và tự động tải về máy.

## 2. Thư viện yêu cầu

- `jspdf`: Thư viện lõi để thao tác, tạo và xuất file PDF phía client (trình duyệt).
- `html2canvas`: Công cụ "chụp ảnh màn hình" các thẻ DOM và convert sang element `<canvas>`.

Cài đặt thông qua npm/yarn/pnpm:
```bash
npm install jspdf html2canvas
```

## 3. Các bước triển khai thực tế

### Bước 1: Tạo React Component làm Template (Hợp đồng)
Tạo file chuyên biệt (ví dụ: `contract-print-template.tsx`). Component này cần cấu hình `ref` bằng hàm `React.forwardRef` để component cha có thể truy xuất thông qua DOM reference.

Lưu ý quan trọng khi style CSS:
- Kích thước bản in tiêu chuẩn A4 tĩnh: `w-[210mm] min-h-[297mm]`.
- Giữ màu nền sắc nét, dùng các thuộc tính font tiêu biểu (như font Serif) cho giống văn bản hành chính thực.
- Hàng lối, text scaling tự xử lý bằng TailwindCSS.

```tsx
import * as React from 'react'

interface ContractPrintTemplateProps {
    contract: any
}

export const ContractPrintTemplate = React.forwardRef<HTMLDivElement, ContractPrintTemplateProps>(
    ({ contract }, ref) => {
        if (!contract) return null

        return (
            <div
                ref={ref}
                className="bg-white p-16 text-black font-serif leading-relaxed text-[13px] w-[210mm] min-h-[297mm] mx-auto"
                style={{ color: '#000' }}
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-bold uppercase text-red-700">Hợp đồng dịch vụ</h1>
                </div>

                {/* Nội dung Hợp đồng, dữ liệu binding từ prop `contract` */}
                <div className="mb-8">
                    <h3 className="font-bold uppercase mb-3 border-b pb-1">Bên B: HỘI VIÊN</h3>
                    <p>Họ và tên: {contract.member_name}</p>
                    <p>Số điện thoại: {contract.phone}</p>
                </div>
            </div>
        )
    }
)

ContractPrintTemplate.displayName = 'ContractPrintTemplate'
```

### Bước 2: Nhúng Template dạng "vô hình" vào giao diện thực tế
Trong giao diện hiển thị chính (ví dụ dialog chi tiết hợp đồng: `contract-details-sheet.tsx`), bạn render component `<ContractPrintTemplate>` và đưa vào một ref. Điểm cốt yếu là ẩn component này qua thuộc tính tọa độ.

```tsx
import { useRef, useState } from 'react'
import { ContractPrintTemplate } from './contract-print-template'

export function ContractDetailsSheet({ contract }) {
    const printRef = useRef<HTMLDivElement>(null)
    const [isExporting, setIsExporting] = useState(false)

    // ...

    return (
        <div>
           {/* ... Giao diện Sheet hiển thị thực tế ... */}
           
           <button onClick={handleExportPDF} disabled={isExporting}>
               Xuất PDF
           </button>

           {/* Hidden Print Template - Đẩy nội dung ra ngoài vùng nhìn thấy */}
           <div className="fixed left-[-9999px] top-0">
               <ContractPrintTemplate ref={printRef} contract={contract} />
           </div>
        </div>
    )
}
```

### Bước 3: Thuật toán Xuất (Export Handler)
Trong hàm xử lý sự kiện `onClick` của nút Xuất PDF, gọi `html2canvas` để quét ref, sau đó tính toán tỷ lệ `ratio` để nén thẻ ảnh vừa in vào khung A4 (210x297 mm) của file jspdf.

```tsx
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from 'sonner' // cho thông báo

const handleExportPDF = async () => {
    if (!printRef.current) return

    setIsExporting(true)
    const toastId = toast.loading('Đang khởi tạo tệp PDF...')

    try {
        // [1] Quan trọng: đợi một chút (500ms) để DOM React có độ trễ render data xong nội dung.
        await new Promise(resolve => setTimeout(resolve, 500))

        // [2] Chụp giao diện DOM. Set scale lớn hơn (>1) để ảnh nét khi đưa vào PDF
        const canvas = await html2canvas(printRef.current, {
            scale: 2, 
            useCORS: true, 
            logging: false,
            backgroundColor: '#ffffff'
        })

        // [3] Export DOM => Base64 Image string
        const imgData = canvas.toDataURL('image/png')
        
        // [4] Khởi tạo object jsPDF khổ A4 (210x297) Portrait (dọc)
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        // [5] Tính toán kích thước (aspect ratio) để nhét vừa ảnh vào PDF
        const imgProps = pdf.getImageProperties(imgData)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        // [6] Canh lề và in layout vào PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        
        // [7] Trigger thao tác lưu tệp xuống máy
        pdf.save(`HopDong_${contract.id || 'Contract'}.pdf`)

        toast.success('Xuất PDF thành công!', { id: toastId })
    } catch (error: any) {
        console.error('PDF Export Error:', error)
        toast.error('Lỗi khi xuất PDF', { id: toastId })
    } finally {
        setIsExporting(false)
    }
}
```

## 4. Ưu/Nhược điểm và Tips Mở rộng

**Ưu điểm của giải pháp:**
- Hữu dụng với hệ sinh thái React, do tái sử dụng được năng lực setup layout Flexbox, Grid tuyệt vời của CSS/Tailwind.
- Có thể tuỳ chỉnh cực kỳ đa dạng từ icon thư viện, hình ảnh tuỳ ý.
- WYSIWYG (What You See Is What You Get) - những gì bạn vẽ dưới dạng HTML sẽ y hệt khi in PDF.

**Tips Mở rộng:**
1. **Tính tương thích phông chữ:** Kỹ thuật này render toàn bộ chữ dưới dạng Hình ảnh, giúp tránh được lỗi không hỗ trợ ký tự Unicode ở một số bộ sinh PDF tự động thay vì encode font trực tiếp.
2. **Tiện ích chuyển Đổi Số thành Chữ:** Với hợp đồng tài chính, thường phải ghi bằng chữ giá trị tiền mặt. Bạn nên viết thêm Helper functions parse biến đổi (ví dụ: `15.000.000` -> `"Mười lăm triệu đồng chẵn"`) và truyền vào Component để Render tự tin.
3. **Nhiều trang:** Nếu DOM template của bạn quá dài (lỗi bị chia cắt trang A4), JS có thể tự động ngắt làm nhiều phần tương đương height chuẩn của jsPDF (297mm * scale pixel) để `doc.addPage()`. Tuy nhiên thông thường một hợp đồng thiết kế fix padding sẽ in vừa trong 1 - vài mặt cố định.
