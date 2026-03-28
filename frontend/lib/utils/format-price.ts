/**
 * Format price in VND for display
 * Examples:
 *   1,500,000,000 → "1,5 tỷ"
 *   850,000,000   → "850 triệu"
 *   580,000,000   → "580 triệu"
 */
export function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    const ty = amount / 1_000_000_000
    const formatted = ty % 1 === 0 ? ty.toString() : ty.toFixed(1).replace('.', ',')
    return `${formatted} tỷ`
  }
  if (amount >= 1_000_000) {
    const trieu = Math.round(amount / 1_000_000)
    return `${trieu} triệu`
  }
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
}

/**
 * Full VND format with currency symbol
 * Example: 580,000,000 → "580.000.000 ₫"
 */
export function formatVNDFull(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format mileage with km unit
 */
export function formatKm(km: number): string {
  return new Intl.NumberFormat('vi-VN').format(km) + ' km'
}
