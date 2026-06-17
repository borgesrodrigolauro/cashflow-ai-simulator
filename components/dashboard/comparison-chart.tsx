"use client"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import type { DailyCashflow } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Props {
  original: DailyCashflow[]
  simulated: DailyCashflow[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-xs">
      <p className="mb-2 font-semibold">{formatDate(label)}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export function ComparisonChart({ original, simulated }: Props) {
  const origMap = new Map(original.map((d) => [d.date, d]))
  const simMap = new Map(simulated.map((d) => [d.date, d]))
  const allDates = [...new Set([...origMap.keys(), ...simMap.keys()])].sort()

  const data = allDates.map((date) => ({
    date,
    "Saldo Original": origMap.get(date)?.saldoAcumulado ?? null,
    "Saldo Simulado": simMap.get(date)?.saldoAcumulado ?? null,
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => formatDate(v).slice(0, 5)}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" />
        <Line
          type="monotone"
          dataKey="Saldo Original"
          stroke="#002468"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 3"
        />
        <Line
          type="monotone"
          dataKey="Saldo Simulado"
          stroke="#099CD6"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
