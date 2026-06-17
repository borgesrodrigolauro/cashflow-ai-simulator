"use client"
import { useState, useEffect } from "react"
import { ScenarioForm } from "@/components/scenarios/scenario-form"
import { AIAnalysisPanel } from "@/components/ai/ai-analysis"
import { ComparisonChart } from "@/components/dashboard/comparison-chart"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Download, Loader2, FlaskConical } from "lucide-react"
import type { AIAnalysis, SimulationResult, SimulationEntry } from "@/lib/types"
import { toast } from "sonner"

interface ScenarioItem {
  id: string
  name: string
  description?: string
  entries: SimulationEntry[]
  result?: SimulationResult
  aiAnalysis?: AIAnalysis
  createdAt: string
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ScenarioItem | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch("/api/scenarios")
    const data = await res.json()
    setScenarios(data.scenarios ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteScenario = async (id: string) => {
    await fetch(`/api/scenarios/${id}`, { method: "DELETE" })
    setScenarios((prev) => prev.filter((s) => s.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success("Cenário excluído")
  }

  const exportScenario = async (id: string, format: "xlsx" | "pdf") => {
    setExporting(`${id}-${format}`)
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id, format }),
      })
      if (!res.ok) throw new Error("Erro ao exportar")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cashflow-${format === "pdf" ? format : "xlsx"}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro")
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#099CD6]" />
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar de cenários */}
      <div className="w-72 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Meus Cenários</h2>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#002468] hover:bg-[#002468]/90">
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Cenário</DialogTitle>
              </DialogHeader>
              <ScenarioForm
                onSave={async (id) => {
                  setNewOpen(false)
                  await load()
                  const found = scenarios.find((s) => s.id === id)
                  if (found) setSelected(found)
                  // Reload to get updated scenario with results
                  const res = await fetch(`/api/scenarios/${id}`)
                  const data = await res.json()
                  if (data.scenario) setSelected(data.scenario)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {scenarios.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum cenário criado ainda.
          </p>
        ) : (
          scenarios.map((s) => (
            <Card
              key={s.id}
              className={`cursor-pointer transition-colors hover:border-[#099CD6] ${selected?.id === s.id ? "border-[#099CD6] bg-blue-50/30" : ""}`}
              onClick={() => setSelected(s)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.entries.length} lançamento(s)
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {s.result && (
                      <Badge variant="success" className="text-[10px] px-1.5">
                        <FlaskConical className="h-2.5 w-2.5 mr-0.5" />
                        Simulado
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); deleteScenario(s.id) }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Conteúdo do cenário selecionado */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Selecione ou crie um cenário
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selected.name}</h2>
              {selected.result && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!exporting}
                    onClick={() => exportScenario(selected.id, "xlsx")}
                  >
                    {exporting === `${selected.id}-xlsx` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!exporting}
                    onClick={() => exportScenario(selected.id, "pdf")}
                  >
                    {exporting === `${selected.id}-pdf` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    PDF
                  </Button>
                </div>
              )}
            </div>

            {selected.result ? (
              <div className="space-y-6">
                {/* KPIs comparativos */}
                <KpiCards
                  indicators={selected.result.indicators.original}
                  simulated={selected.result.indicators.simulated}
                />

                {/* Gráfico comparativo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Saldo Original vs Simulado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ComparisonChart
                      original={selected.result.originalFlow}
                      simulated={selected.result.simulatedFlow}
                    />
                  </CardContent>
                </Card>

                {/* Análise IA */}
                {selected.aiAnalysis && (
                  <div>
                    <h3 className="mb-3 font-semibold text-[#002468]">Análise do Consultor IA</h3>
                    <AIAnalysisPanel analysis={selected.aiAnalysis} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <ScenarioForm
                  scenarioId={selected.id}
                  scenarioName={selected.name}
                  existingEntries={selected.entries}
                  onSave={async (id) => {
                    const res = await fetch(`/api/scenarios/${id}`)
                    const data = await res.json()
                    if (data.scenario) {
                      setSelected(data.scenario)
                      setScenarios((prev) =>
                        prev.map((s) => (s.id === id ? data.scenario : s))
                      )
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
