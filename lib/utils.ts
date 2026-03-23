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
