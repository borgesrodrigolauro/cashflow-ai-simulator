"use client"
import { TrendingDown, TrendingUp, Wallet, AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { FlowIndicators } from "@/lib/types"

interface Props {
  indicators: FlowIndicators
  simulated?: FlowIndicators
}

export function KpiCards({ indicators: i, simulated: s }: Props) {
  const cards = [
    {
      title: "Saldo Atual",
      value: formatCurrency(i.currentBalance),
      delta: s ? formatCurrency(s.currentBalance - i.currentBalance) : null,
      positive: s ? s.currentBalance >= i.currentBalance : i.currentBalance >= 0,
      icon: Wallet,
      color: i.currentBalance >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Saldo Mínimo",
      value: formatCurrency(i.minBalance),
      delta: s ? formatCurrency(s.minBalance - i.minBalance) : null,
      positive: s ? s.minBalance >= i.minBalance : i.minBalance >= 0,
      icon: TrendingDown,
      color: i.minBalance >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Saldo Máximo",
      value: formatCurrency(i.maxBalance),
      delta: s ? formatCurrency(s.maxBalance - i.maxBalance) : null,
      positive: true,
      icon: TrendingUp,
      color: "text-[#099CD6]",
    },
    {
      title: "Dias Negativos",
      value: String(i.negativeDays),
      delta: s ? String(s.negativeDays - i.negativeDays) : null,
      positive: s ? s.negativeDays <= i.negativeDays : i.negativeDays === 0,
      icon: AlertTriangle,
      color: i.negativeDays > 0 ? "text-red-500" : "text-green-600",
    },
    {
      title: "Total a Receber",
      value: formatCurrency(i.totalReceber),
      delta: s ? formatCurrency(s.totalReceber - i.totalReceber) : null,
      positive: true,
      icon: ArrowUpRight,
      color: "text-green-600",
    },
    {
      title: "Total a Pagar",
      value: formatCurrency(i.totalPagar),
      delta: s ? formatCurrency(s.totalPagar - i.totalPagar) : null,
      positive: false,
      icon: ArrowDownRight,
      color: "text-red-500",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            {card.delta && s && (
              <p className={`mt-1 text-xs ${card.positive ? "text-green-600" : "text-red-500"}`}>
                {card.positive ? "▲" : "▼"} {card.delta} simulado
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
