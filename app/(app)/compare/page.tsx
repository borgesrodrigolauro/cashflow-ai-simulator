"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComparisonChart } from "@/components/dashboard/comparison-chart"
import { Badge } from "@/components/ui/badge"
import { Loader2, FlaskConical } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { SimulationResult, FlowIndicators } from "@/lib/types"

interface ScenarioItem {
  id: string
  name: string
  result?: SimulationResult
}

const COLORS = ["#002468", "#099CD6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]

function IndicatorRow({ label, values }: { label: string; values: (string | number)[] }) {
  return (
    <tr className="border-b">
      <td className="py-2 pr-4 text-sm font-medium text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-2 px-3 text-sm font-semibold text-center">
          {typeof v === "number" ? formatCurrency(v) : v}
        </td>
      ))}
    </tr>
  )
}

export default function ComparePage() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/scenarios")
      .then((r) => r.json())
      .then((d) => {
        const withResults = (d.scenarios ?? []).filter((s: ScenarioItem) => s.result)
        setScenarios(withResults)
        // Auto-select first 3
        setSelected(new Set(withResults.slice(0, 3).map((s: ScenarioItem) => s.id)))
        setLoading(false)
      })
  }, [])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#099CD6]" />
      </div>
    )
  }

  if (!scenarios.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <FlaskConical className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Nenhum cenário simulado ainda.</p>
        <p className="text-xs text-muted-foreground">Crie e simule cenários para compará-los.</p>
      </div>
    )
  }

  const active = scenarios.filter((s) => selected.has(s.id))

  return (
    <div className="space-y-6">
      {/* Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Selecionar Cenários para Comparar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {scenarios.map((s, i) => (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                selected.has(s.id)
                  ? "border-transparent text-white"
                  : "border-gray-200 text-muted-foreground hover:border-gray-400"
              }`}
              style={selected.has(s.id) ? { backgroundColor: COLORS[i % COLORS.length] } : {}}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              {s.name}
            </button>
          ))}
        </CardContent>
      </Card>

      {active.length > 0 && (
        <>
          {/* Gráfico comparativo — múltiplas linhas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Saldo Acumulado — Comparativo</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Use the comparison chart between first two or render multi-line */}
              {active.length >= 2 && active[0].result && active[1].result ? (
                <ComparisonChart
                  original={active[0].result.simulatedFlow}
                  simulated={active[1].result.simulatedFlow}
                />
              ) : active[0].result ? (
                <ComparisonChart
                  original={active[0].result.originalFlow}
                  simulated={active[0].result.simulatedFlow}
                />
              ) : null}
            </CardContent>
          </Card>

          {/* Tabela comparativa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tabela Comparativa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 pr-4 text-left text-xs text-muted-foreground">Indicador</th>
                      {active.map((s, i) => (
                        <th key={s.id} className="py-2 px-3 text-center">
                          <Badge
                            className="text-white text-xs"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          >
                            {s.name}
                          </Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Saldo Mínimo", (ind: FlowIndicators) => ind.minBalance],
                      ["Saldo Máximo", (ind: FlowIndicators) => ind.maxBalance],
                      ["Saldo Médio", (ind: FlowIndicators) => ind.avgBalance],
                      ["Dias Negativos", (ind: FlowIndicators) => ind.negativeDays],
                      ["Total a Receber", (ind: FlowIndicators) => ind.totalReceber],
                      ["Total a Pagar", (ind: FlowIndicators) => ind.totalPagar],
                      ["Melhor Dia", (ind: FlowIndicators) => formatDate(ind.bestDay.date)],
                      ["Pior Dia", (ind: FlowIndicators) => formatDate(ind.worstDay.date)],
                    ].map(([label, fn]) => (
                      <IndicatorRow
                        key={label as string}
                        label={label as string}
                        values={active.map((s) =>
                          s.result ? (fn as (i: FlowIndicators) => string | number)(s.result.indicators.simulated) : "—"
                        )}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
