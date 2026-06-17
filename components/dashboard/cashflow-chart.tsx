"use client"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import type { DailyCashflow } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Props {
  data: DailyCashflow[]
  title?: string
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

export function CashflowChart({ data, title = "Evolução do Caixa" }: Props) {
  const chartData = data.map((d) => ({
    date: d.date,
    Receber: d.receber,
    Pagar: d.pagar,
    Saldo: d.saldoAcumulado,
  }))

  return (
    <div className="w-full">
      {title && <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorReceber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPagar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#099CD6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#099CD6" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area type="monotone" dataKey="Receber" stroke="#22c55e" fill="url(#colorReceber)" strokeWidth={2} />
          <Area type="monotone" dataKey="Pagar" stroke="#ef4444" fill="url(#colorPagar)" strokeWidth={2} />
          <Area type="monotone" dataKey="Saldo" stroke="#099CD6" fill="url(#colorSaldo)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
