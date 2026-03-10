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
