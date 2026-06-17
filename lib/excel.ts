import * as XLSX from "xlsx"
import type { CashflowEntry, PaymentCode } from "./types"
import { parseBRDate, parseBRNumber, formatDateISO } from "./utils"

export function parseCashflowExcel(buffer: ArrayBuffer): CashflowEntry[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false })

  // Procurar aba FLUXO Caixa / FLUXO CAIXA
  const sheetName =
    wb.SheetNames.find(
      (n) =>
        n.toUpperCase().includes("FLUXO") &&
        (n.toUpperCase().includes("CAIXA") || n.toUpperCase().includes("DIARIO"))
    ) ?? wb.SheetNames[0]

  const ws = wb.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown[][]

  // Encontrar linha de cabeçalho (contém "Vencimento" ou "A RECEBER")
  let headerRow = -1
  for (let i = 0; i < Math.min(raw.length, 20); i++) {
    const row = raw[i] as unknown[]
    const rowStr = row.join("|").toUpperCase()
    if (rowStr.includes("VENCIMENTO") || rowStr.includes("A RECEBER")) {
      headerRow = i
      break
    }
  }

  if (headerRow === -1) {
    // Fallback: assume row 3 (índice 3 = linha 4)
    headerRow = 3
  }

  // Mapear índices de colunas
  const headers = (raw[headerRow] as unknown[]).map((h) => String(h).trim().toUpperCase())

  const colA = 0 // Vencimento
  let colK = headers.findIndex((h) => h.includes("RECEBER") || h.includes("A RECEBER"))
  let colL = headers.findIndex((h) => h.includes("PAGAR") || h.includes("A PAGAR"))
  let colM = headers.findIndex((h) => h === "SALDO" || h.includes("SALDO DIÁRIO"))

  // Fallback para posições fixas (col K=10, L=11, M=12)
  if (colK === -1) colK = 10
  if (colL === -1) colL = 11
  if (colM === -1) colM = 12

  const colFornecedor = headers.findIndex((h) => h.includes("NOME") || h.includes("FANTASIA"))
  const colClasse = headers.findIndex((h) => h.includes("CLASSE"))
  const colCusto = headers.findIndex((h) => h.includes("CENTRO") || h.includes("CUSTO"))
  const colStatus = headers.findIndex((h) => h.includes("STATUS"))
  const colDoc = headers.findIndex((h) => h === "DOCUMENTO" || h.includes("DOC"))

  const entries: CashflowEntry[] = []

  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i] as unknown[]
    if (!row[colA]) continue

    const rawDate = row[colA]
    const dateVal =
      typeof rawDate === "number"
        ? (() => {
            const d = new Date((rawDate - 25569) * 86400 * 1000)
            return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
          })()
        : parseBRDate(String(rawDate))

    if (!dateVal || isNaN(dateVal.getTime())) continue

    const receber = parseBRNumber(row[colK] as string | number)
    const pagar = parseBRNumber(row[colL] as string | number)
    const saldo = parseBRNumber(row[colM] as string | number)

    if (receber === 0 && pagar === 0 && saldo === 0) continue

    entries.push({
      date: formatDateISO(dateVal),
      documento: colDoc >= 0 ? String(row[colDoc] ?? "") : undefined,
      fornecedor: colFornecedor >= 0 ? String(row[colFornecedor] ?? "") : undefined,
      classeFinanceira: colClasse >= 0 ? String(row[colClasse] ?? "") : undefined,
      centroCusto: colCusto >= 0 ? String(row[colCusto] ?? "") : undefined,
      status: colStatus >= 0 ? String(row[colStatus] ?? "") : undefined,
      receber,
      pagar,
      saldo,
    })
  }

  return entries
}

export function parsePaymentCodesExcel(buffer: ArrayBuffer): PaymentCode[] {
  const wb = XLSX.read(buffer, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
  }) as unknown[][]

  if (raw.length < 2) return []

  // Encontrar linha de cabeçalho
  let headerRow = 0
  for (let i = 0; i < Math.min(raw.length, 5); i++) {
    const row = raw[i] as unknown[]
    const rowStr = row.join("|").toUpperCase()
    if (rowStr.includes("CÓD") || rowStr.includes("COD") || rowStr.includes("CÓDIGO")) {
      headerRow = i
      break
    }
  }

  const headers = (raw[headerRow] as unknown[]).map((h) => String(h).trim().toUpperCase())

  let colCode = headers.findIndex((h) => h.includes("CÓD") || h.includes("COD"))
  let colDesc = headers.findIndex(
    (h) => h.includes("COND") || h.includes("DESC") || h.includes("PAGAMENTO")
  )
  const colType = headers.findIndex((h) => h.includes("TIPO"))
  const colParcelas = headers.findIndex((h) => h.includes("PARCEL"))
  const colCategoria = headers.findIndex(
    (h) => h.includes("CATEG") || h.includes("CLASSE")
  )

  if (colCode === -1) colCode = 0
  if (colDesc === -1) colDesc = 1

  const codes: PaymentCode[] = []

  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i] as unknown[]
    const code = String(row[colCode] ?? "").trim()
    const desc = String(row[colDesc] ?? "").trim()
    if (!code || !desc) continue

    const rawType = colType >= 0 ? String(row[colType] ?? "").toUpperCase() : ""
    const type: "receita" | "despesa" =
      rawType.includes("VENDA") || rawType.includes("RECEITA") || rawType.includes("RECEB")
        ? "receita"
        : "despesa"

    const parcelas =
      colParcelas >= 0 ? parseInt(String(row[colParcelas] ?? "1")) || 1 : 1

    const category =
      colCategoria >= 0 ? String(row[colCategoria] ?? "").trim() : rawType

    codes.push({ code, description: desc, category, type, parcelas })
  }

  return codes
}
