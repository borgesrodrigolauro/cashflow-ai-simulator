import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date
  return d.toLocaleDateString("pt-BR")
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function parseBRDate(value: string): Date | null {
  if (!value) return null
  // DD/MM/YYYY
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
  // YYYY-MM-DD
  const iso = value.match(/^\d{4}-\d{2}-\d{2}$/)
  if (iso) return new Date(value + "T00:00:00")
  // Excel serial number
  const num = parseFloat(value)
  if (!isNaN(num) && num > 40000) {
    const d = new Date((num - 25569) * 86400 * 1000)
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }
  return null
}

export function parseBRNumber(value: string | number): number {
  if (typeof value === "number") return isNaN(value) ? 0 : value
  if (!value) return 0
  const cleaned = String(value)
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}
