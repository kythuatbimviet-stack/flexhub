import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function numberToVietnameseWords(number: number): string {
  if (number === 0) return "không"

  const units = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"]
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]

  function readThreeDigits(n: number, isFirstGroup: boolean): string {
    let res = ""
    const hundred = Math.floor(n / 100)
    const ten = Math.floor((n % 100) / 10)
    const unit = n % 10

    if (hundred > 0 || !isFirstGroup) {
      res += digits[hundred] + " trăm "
    }

    if (ten > 0) {
      if (ten === 1) res += "mười "
      else res += digits[ten] + " mươi "
    } else if (hundred > 0 && unit > 0) {
      res += "lẻ "
    }

    if (unit > 0) {
      if (unit === 1 && ten > 1) res += "mốt"
      else if (unit === 5 && ten > 0) res += "lăm"
      else res += digits[unit]
    }

    return res.trim()
  }

  let res = ""
  let unitIdx = 0
  let tempNumber = Math.abs(Math.floor(number))

  while (tempNumber > 0) {
    const group = tempNumber % 1000
    if (group > 0) {
      const groupStr = readThreeDigits(group, tempNumber < 1000)
      res = groupStr + units[unitIdx] + (res ? " " + res : "")
    }
    tempNumber = Math.floor(tempNumber / 1000)
    unitIdx++
  }

  const finalResult = res.trim()
  return finalResult.charAt(0).toUpperCase() + finalResult.slice(1)
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function getVietQRUrl(bankCode: string, accountNo: string, amount: number, accountName: string, description: string) {
    const bankMap: { [key: string]: string } = {
        'Vietcombank': 'VCB',
        'VCB': 'VCB',
        'Vietinbank': 'ICB',
        'ICB': 'ICB',
        'BIDV': 'BIDV',
        'Agribank': 'VBA',
        'Techcombank': 'TCB',
        'MBBank': '970422',
        'MB': '970422',
        'MB Bank': '970422',
        'TPBank': 'TPB',
        'VPBank': 'VPB',
        'ACB': 'ACB',
        'HDBank': 'HDB',
        'Sacombank': 'STB',
        'SCB': 'SCB',
        'MSB': 'MSB',
        'VIB': 'VIB',
        'SHB': 'SHB'
    }
    
    // Normalize bank code: map if found, then remove all spaces
    const bankId = (bankMap[bankCode] || bankCode || '').toString().replace(/\s/g, '')
    const cleanAccount = (accountNo || '').toString().replace(/\D/g, '')
    const encodedName = encodeURIComponent(accountName || '')
    
    // Sanitize description: remove accents and keep only alphanumeric, spaces, and hyphens
    const sanitizedDesc = (description || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9 -]/g, '')
    
    const encodedDesc = encodeURIComponent(sanitizedDesc)
    
    return `https://img.vietqr.io/image/${bankId}-${cleanAccount}-compact.png?amount=${amount}&addInfo=${encodedDesc}&accountName=${encodedName}`
}
export function formatExcelDate(value: any): string | null {
    if (!value) return null;

    // Case 1: Already a valid YYYY-MM-DD string
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    // Case 2: Javascript Date object
    if (value instanceof Date) {
        try {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return null;
        }
    }

    // Case 3: Excel serial date (number)
    const serial = Number(value);
    if (!isNaN(serial) && serial > 1 && serial < 100000) { // Safety range for common human dates
        try {
            // Excel dates are number of days since Dec 30, 1899.
            // 25569 is the number of days between 1899-12-30 and 1970-01-01.
            const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            // fallback
        }
    }

    // Case 4: Other string formats (DD/MM/YYYY, DD-MM-YYYY etc)
    if (typeof value === 'string') {
        const parts = value.split(/[/\-.]/);
        if (parts.length === 3) {
            // Assume DD/MM/YYYY -> YYYY-MM-DD
            if (parts[2].length === 4) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
            }
            // Assume YYYY/MM/DD -> YYYY-MM-DD
            if (parts[0].length === 4) {
                const year = parts[0];
                const month = parts[1].padStart(2, '0');
                const day = parts[2].padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        }
    }

    return null;
}

export function formatDecimalForDisplay(value: number | string | null | undefined): string {
    if (value == null || value === '') return ''
    return value.toString().replace('.', ',')
}

export function parseDecimalInput(value: string): string {
    if (!value) return ''
    // Replace comma with dot and keep only relevant numeric chars
    const cleaned = value.replace(',', '.')
    if (cleaned === '.') return '0.'
    return cleaned
}

export function isValidDecimalInput(value: string): boolean {
    // Allows digits and at most one dot or comma
    return /^\d*[.,]?\d*$/.test(value)
}
