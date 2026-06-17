"use client"
import { useEffect, useState } from "react"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { ComparisonChart } from "@/components/dashboard/comparison-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Upload, FlaskConical, Loader2 } from "lucide-react"
import Link from "next/link"
import type { CashflowEntry, DailyCashflow, FlowIndicators } from "@/lib/types"

function buildDailyFlow(entries: CashflowEntry[]): DailyCashflow[] {
  const map = new Map<string, { receber: number; pagar: number; saldo: number }>()
  for (const e of entries) {
    const ex = map.get(e.date) ?? { receber: 0, pagar: 0, saldo: 0 }
    ex.receber += e.receber
    ex.pagar += e.pagar
    ex.saldo = e.saldo
    map.set(e.date, ex)
  }
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  let acc = 0
  return sorted.map(([date, v]) => {
    acc += v.receber - v.pagar
    return { date, ...v, saldoAcumulado: acc }
  })
}

function computeIndicators(flow: DailyCashflow[]): FlowIndicators {
  if (!flow.length) return { minBalance: 0, maxBalance: 0, avgBalance: 0, negativeDays: 0, worstDay: { date: "", balance: 0 }, bestDay: { date: "", balance: 0 }, totalReceber: 0, totalPagar: 0, currentBalance: 0 }
  let min = Infinity, max = -Infinity, total = 0, neg = 0, receber = 0, pagar = 0
  let worst = flow[0], best = flow[0]
  for (const d of flow) {
    receber += d.receber; pagar += d.pagar; total += d.saldoAcumulado
    if (d.saldoAcumulado < 0) neg++
    if (d.saldoAcumulado < min) { min = d.saldoAcumulado; worst = d }
    if (d.saldoAcumulado > max) { max = d.saldoAcumulado; best = d }
  }
  return { minBalance: min, maxBalance: max, avgBalance: total / flow.length, negativeDays: neg, worstDay: { date: worst.date, balance: worst.saldoAcumulado }, bestDay: { date: best.date, balance: best.saldoAcumulado }, totalReceber: receber, totalPagar: pagar, currentBalance: flow[flow.length - 1]?.saldoAcumulado ?? 0 }
}

export default function DashboardPage() {
  const [flow, setFlow] = useState<DailyCashflow[]>([])
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState<Array<{ id: string; name: string; result: unknown }>>([])
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/cashflow").then((r) => r.json()),
      fetch("/api/scenarios").then((r) => r.json()),
    ]).then(([cf, sc]) => {
      if (cf.data?.entries) setFlow(buildDailyFlow(cf.data.entries))
      if (sc.scenarios) setScenarios(sc.scenarios.filter((s: { result: unknown }) => s.result))
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#099CD6]" />
      </div>
    )
  }

  if (!flow.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">Nenhum dado importado ainda.</p>
        <Link href="/import">
          <Button className="bg-[#002468] hover:bg-[#002468]/90">
            <Upload className="h-4 w-4" />
            Importar Fluxo de Caixa
          </Button>
        </Link>
      </div>
    )
  }

  const indicators = computeIndicators(flow)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simResult = selectedScenario ? (scenarios.find((s) => s.id === selectedScenario)?.result as any) : null

  return (
    <div className="space-y-6">
      {/* Scenario selector */}
      {scenarios.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Comparar com:</span>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedScenario === null ? "default" : "outline"}
              onClick={() => setSelectedScenario(null)}
              className={selectedScenario === null ? "bg-[#002468]" : ""}
            >
              Apenas Original
            </Button>
            {scenarios.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={selectedScenario === s.id ? "default" : "outline"}
                onClick={() => setSelectedScenario(s.id)}
                className={selectedScenario === s.id ? "bg-[#099CD6]" : ""}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {s.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <KpiCards
        indicators={indicators}
        simulated={simResult?.indicators?.simulated}
      />

      {/* Charts */}
      <Tabs defaultValue="evolution">
        <TabsList>
          <TabsTrigger value="evolution">Evolução Diária</TabsTrigger>
          <TabsTrigger value="comparison" disabled={!simResult}>
            Comparativo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Receitas · Despesas · Saldo Acumulado</CardTitle>
            </CardHeader>
            <CardContent>
              <CashflowChart data={simResult?.simulatedFlow ?? flow} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          {simResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Original vs Simulado</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonChart
                  original={simResult.originalFlow}
                  simulated={simResult.simulatedFlow}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
