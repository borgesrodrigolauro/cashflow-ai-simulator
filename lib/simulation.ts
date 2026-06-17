import type {
  CashflowEntry,
  DailyCashflow,
  SimulationEntry,
  SimulationResult,
  FlowIndicators,
} from "./types"
import { addDays, formatDateISO } from "./utils"

function buildDailyFlow(entries: CashflowEntry[]): DailyCashflow[] {
  const map = new Map<string, { receber: number; pagar: number; saldo: number }>()

  for (const e of entries) {
    const key = e.date
    const existing = map.get(key) ?? { receber: 0, pagar: 0, saldo: 0 }
    existing.receber += e.receber
    existing.pagar += e.pagar
    existing.saldo = e.saldo // usar último saldo do dia
    map.set(key, existing)
  }

  const sorted = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  let acc = 0
  return sorted.map((row) => {
    acc += row.receber - row.pagar
    return {
      date: row.date,
      receber: row.receber,
      pagar: row.pagar,
      saldo: row.saldo,
      saldoAcumulado: acc,
    }
  })
}

function expandSimulationEntries(
  entries: SimulationEntry[]
): Array<{ date: string; receber: number; pagar: number }> {
  const result: Array<{ date: string; receber: number; pagar: number }> = []

  for (const entry of entries) {
    const perInstallment = entry.value / entry.installments
    const start = new Date(entry.startDate + "T00:00:00")

    for (let i = 0; i < entry.installments; i++) {
      const date = addDays(start, i * entry.intervalDays)
      result.push({
        date: formatDateISO(date),
        receber: entry.type === "receita" ? perInstallment : 0,
        pagar: entry.type === "despesa" ? perInstallment : 0,
      })
    }
  }

  return result
}

function computeIndicators(flow: DailyCashflow[]): FlowIndicators {
  if (!flow.length) {
    return {
      minBalance: 0,
      maxBalance: 0,
      avgBalance: 0,
      negativeDays: 0,
      worstDay: { date: "", balance: 0 },
      bestDay: { date: "", balance: 0 },
      totalReceber: 0,
      totalPagar: 0,
      currentBalance: 0,
    }
  }

  let min = Infinity,
    max = -Infinity,
    totalBalance = 0,
    negativeDays = 0,
    totalReceber = 0,
    totalPagar = 0
  let worstDay = flow[0],
    bestDay = flow[0]

  for (const d of flow) {
    totalReceber += d.receber
    totalPagar += d.pagar
    totalBalance += d.saldoAcumulado
    if (d.saldoAcumulado < 0) negativeDays++
    if (d.saldoAcumulado < min) {
      min = d.saldoAcumulado
      worstDay = d
    }
    if (d.saldoAcumulado > max) {
      max = d.saldoAcumulado
      bestDay = d
    }
  }

  return {
    minBalance: min === Infinity ? 0 : min,
    maxBalance: max === -Infinity ? 0 : max,
    avgBalance: totalBalance / flow.length,
    negativeDays,
    worstDay: { date: worstDay.date, balance: worstDay.saldoAcumulado },
    bestDay: { date: bestDay.date, balance: bestDay.saldoAcumulado },
    totalReceber,
    totalPagar,
    currentBalance: flow[flow.length - 1]?.saldoAcumulado ?? 0,
  }
}

export function simulate(
  originalEntries: CashflowEntry[],
  simulationEntries: SimulationEntry[]
): SimulationResult {
  const originalFlow = buildDailyFlow(originalEntries)

  const simVirtual = expandSimulationEntries(simulationEntries)
  const map = new Map<string, { receber: number; pagar: number; saldo: number }>()

  for (const e of originalEntries) {
    const key = e.date
    const ex = map.get(key) ?? { receber: 0, pagar: 0, saldo: 0 }
    ex.receber += e.receber
    ex.pagar += e.pagar
    ex.saldo = e.saldo
    map.set(key, ex)
  }

  for (const v of simVirtual) {
    const ex = map.get(v.date) ?? { receber: 0, pagar: 0, saldo: 0 }
    ex.receber += v.receber
    ex.pagar += v.pagar
    map.set(v.date, ex)
  }

  const simSorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b))

  let acc = 0
  const simulatedFlow: DailyCashflow[] = simSorted.map(([date, v]) => {
    acc += v.receber - v.pagar
    return {
      date,
      receber: v.receber,
      pagar: v.pagar,
      saldo: v.saldo + (v.receber - v.pagar),
      saldoAcumulado: acc,
      isSimulated: simVirtual.some((sv) => sv.date === date),
    }
  })

  return {
    originalFlow,
    simulatedFlow,
    indicators: {
      original: computeIndicators(originalFlow),
      simulated: computeIndicators(simulatedFlow),
    },
  }
}

export function findBestPaymentDates(
  originalEntries: CashflowEntry[],
  amount: number,
  lookAheadDays = 90
): Array<{ date: string; projectedBalance: number; impact: number }> {
  const flow = buildDailyFlow(originalEntries)
  const dateMap = new Map(flow.map((d) => [d.date, d]))
  const today = new Date()
  const results = []

  for (let i = 1; i <= lookAheadDays; i++) {
    const date = addDays(today, i)
    const dateStr = formatDateISO(date)
    const existing = dateMap.get(dateStr)
    const baseBalance = existing?.saldoAcumulado ?? flow[flow.length - 1]?.saldoAcumulado ?? 0
    const projected = baseBalance - amount
    results.push({ date: dateStr, projectedBalance: projected, impact: amount })
  }

  return results
    .filter((r) => r.projectedBalance > 0)
    .sort((a, b) => b.projectedBalance - a.projectedBalance)
    .slice(0, 5)
}
