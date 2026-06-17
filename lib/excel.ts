import * as XLSX from "xlsx"
import type { CashflowEntry, PaymentCode } from "./types"
import { parseBRDate, parseBRNumber, formatDateISO } from "./utils"

export type CashflowColumnMeta = {
  index: number
  header: string
  detected: boolean
}

export type CashflowParseResult = {
  entries: CashflowEntry[]
  meta: {
    sheetName: string
    availableSheets: string[]
    headerRowIndex: number
    totalDataRows: number
    columns: {
      date: CashflowColumnMeta
      receber: CashflowColumnMeta
      pagar: CashflowColumnMeta
      saldo: CashflowColumnMeta
    }
  }
}

function colLetter(idx: number): string {
  let result = ""
  let n = idx
  do {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return result
}

export function parseCashflowExcel(buffer: ArrayBuffer): CashflowParseResult {
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

  // Encontrar linha de cabeçalho
  let headerRow = -1
  for (let i = 0; i < Math.min(raw.length, 20); i++) {
    const row = raw[i] as unknown[]
    const rowStr = row.join("|").toUpperCase()
    if (
      rowStr.includes("VENCIMENTO") ||
      rowStr.includes("A RECEBER") ||
      rowStr.includes("DATA")
    ) {
      headerRow = i
      break
    }
  }
  if (headerRow === -1) headerRow = 3

  const headers = (raw[headerRow] as unknown[]).map((h) => String(h).trim().toUpperCase())

  const colDate = 0

  let idxReceber = headers.findIndex(
    (h) => h.includes("A RECEBER") || (h.includes("RECEBER") && !h.includes("PAGAR"))
  )
  let idxPagar = headers.findIndex(
    (h) => h.includes("A PAGAR") || (h.includes("PAGAR") && !h.includes("RECEBER"))
  )
  let idxSaldo = headers.findIndex(
    (h) => h === "SALDO" || h.includes("SALDO") || h.includes("LÍQUIDO")
  )

  const detectedReceber = idxReceber !== -1
  const detectedPagar = idxPagar !== -1
  const detectedSaldo = idxSaldo !== -1

  if (!detectedReceber) idxReceber = 10
  if (!detectedPagar) idxPagar = 11
  if (!detectedSaldo) idxSaldo = 12

  const colFornecedor = headers.findIndex((h) => h.includes("NOME") || h.includes("FANTASIA"))
  const colClasse = headers.findIndex((h) => h.includes("CLASSE"))
  const colCusto = headers.findIndex((h) => h.includes("CENTRO") || h.includes("CUSTO"))
  const colStatus = headers.findIndex((h) => h.includes("STATUS"))
  const colDoc = headers.findIndex((h) => h === "DOCUMENTO" || h.includes("DOC"))

  const entries: CashflowEntry[] = []

  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i] as unknown[]
    if (!row[colDate]) continue

    const rawDate = row[colDate]
    const dateVal =
      typeof rawDate === "number"
        ? (() => {
            const d = new Date((rawDate - 25569) * 86400 * 1000)
            return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
          })()
        : parseBRDate(String(rawDate))

    if (!dateVal || isNaN(dateVal.getTime())) continue

    const receber = parseBRNumber(row[idxReceber] as string | number)
    const pagar = parseBRNumber(row[idxPagar] as string | number)
    const saldo = parseBRNumber(row[idxSaldo] as string | number)

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

  return {
    entries,
    meta: {
      sheetName,
      availableSheets: wb.SheetNames,
      headerRowIndex: headerRow,
      totalDataRows: raw.length - headerRow - 1,
      columns: {
        date: { index: colDate, header: headers[colDate] || "A", detected: true },
        receber: {
          index: idxReceber,
          header: headers[idxReceber] || `${colLetter(idxReceber)}`,
          detected: detectedReceber,
        },
        pagar: {
          index: idxPagar,
          header: headers[idxPagar] || `${colLetter(idxPagar)}`,
          detected: detectedPagar,
        },
        saldo: {
          index: idxSaldo,
          header: headers[idxSaldo] || `${colLetter(idxSaldo)}`,
          detected: detectedSaldo,
        },
      },
    },
  }
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
