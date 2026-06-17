"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PaymentCode, SimulationEntry } from "@/lib/types"
import { toast } from "sonner"

const entrySchema = z.object({
  paymentCode: z.string().min(1),
  description: z.string().min(1),
  value: z.number().positive(),
  type: z.enum(["receita", "despesa"]),
  startDate: z.string().min(1),
  installments: z.number().int().min(1).max(360),
  intervalDays: z.number().int().min(1),
})

type EntryForm = z.infer<typeof entrySchema>

interface Props {
  scenarioId?: string
  scenarioName?: string
  existingEntries?: SimulationEntry[]
  onSave?: (scenarioId: string) => void
}

export function ScenarioForm({ scenarioId, scenarioName, existingEntries = [], onSave }: Props) {
  const [codes, setCodes] = useState<PaymentCode[]>([])
  const [entries, setEntries] = useState<SimulationEntry[]>(existingEntries)
  const [saving, setSaving] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [name, setName] = useState(scenarioName ?? "")

  const form = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      type: "despesa",
      installments: 1,
      intervalDays: 30,
      startDate: new Date().toISOString().split("T")[0],
    },
  })

  useEffect(() => {
    fetch("/api/payment-codes")
      .then((r) => r.json())
      .then((d) => setCodes(d.codes ?? []))
      .catch(() => {})
  }, [])

  const onCodeChange = (code: string) => {
    const found = codes.find((c) => c.code === code)
    if (found) {
      form.setValue("paymentCode", found.code)
      form.setValue("description", found.description)
      form.setValue("type", found.type)
      if (found.parcelas && found.parcelas > 1) form.setValue("installments", found.parcelas)
    }
  }

  const addEntry = form.handleSubmit((data) => {
    setEntries((prev) => [...prev, { ...data, id: crypto.randomUUID() }])
    form.reset({ type: "despesa", installments: 1, intervalDays: 30, startDate: new Date().toISOString().split("T")[0] })
  })

  const removeEntry = (idx: number) => setEntries((prev) => prev.filter((_, i) => i !== idx))

  const saveScenario = async () => {
    if (!name.trim()) { toast.error("Informe um nome para o cenário"); return }
    if (!entries.length) { toast.error("Adicione ao menos um lançamento"); return }
    setSaving(true)
    try {
      const url = scenarioId ? `/api/scenarios/${scenarioId}` : "/api/scenarios"
      const method = scenarioId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, entries }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const id = scenarioId ?? data.scenario.id
      toast.success("Cenário salvo!")
      onSave?.(id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const simulate = async () => {
    if (!name.trim() || !entries.length) { toast.error("Salve o cenário primeiro"); return }
    setSaving(true)
    setSimulating(true)
    try {
      const url = scenarioId ? `/api/scenarios/${scenarioId}` : "/api/scenarios"
      const method = scenarioId ? "PUT" : "POST"
      const res1 = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, entries }),
      })
      const d1 = await res1.json()
      if (!res1.ok) throw new Error(d1.error)
      const id = scenarioId ?? d1.scenario.id

      const res2 = await fetch(`/api/scenarios/${id}/simulate`, { method: "POST" })
      const d2 = await res2.json()
      if (!res2.ok) throw new Error(d2.error)

      toast.success("Simulação concluída! Veja os resultados.")
      onSave?.(id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro na simulação")
    } finally {
      setSaving(false)
      setSimulating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Nome do cenário */}
      <div>
        <Label>Nome do Cenário</Label>
        <Input
          className="mt-1"
          placeholder="Ex: Compra maquinário à vista"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Formulário de lançamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addEntry} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Código de Pagamento</Label>
              {codes.length > 0 ? (
                <Select onValueChange={onCodeChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar código" />
                  </SelectTrigger>
                  <SelectContent>
                    {codes.slice(0, 100).map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} — {c.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="mt-1"
                  placeholder="Código"
                  {...form.register("paymentCode")}
                />
              )}
            </div>

            <div>
              <Label>Descrição</Label>
              <Input className="mt-1" {...form.register("description")} placeholder="Descrição" />
            </div>

            <div>
              <Label>Valor Total (R$)</Label>
              <Input
                className="mt-1"
                type="number"
                step="0.01"
                {...form.register("value", { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label>Tipo</Label>
              <Select
                defaultValue="despesa"
                onValueChange={(v) => form.setValue("type", v as "receita" | "despesa")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data Início</Label>
              <Input className="mt-1" type="date" {...form.register("startDate")} />
            </div>

            <div>
              <Label>Parcelas</Label>
              <Input
                className="mt-1"
                type="number"
                min={1}
                {...form.register("installments", { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label>Intervalo (dias)</Label>
              <Input
                className="mt-1"
                type="number"
                min={1}
                {...form.register("intervalDays", { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full bg-[#002468] hover:bg-[#002468]/90">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de lançamentos */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lançamentos ({entries.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {entries.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.type === "despesa" ? "▼ Despesa" : "▲ Receita"} · R${" "}
                      {entry.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ·{" "}
                      {entry.installments}x/{entry.intervalDays}d · início {entry.startDate}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntry(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={saveScenario}
          disabled={saving}
          className="flex-1"
        >
          {saving && !simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar Cenário
        </Button>
        <Button
          onClick={simulate}
          disabled={saving}
          className="flex-1 bg-[#099CD6] hover:bg-[#099CD6]/90 text-white"
        >
          {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          SIMULAR IMPACTO
        </Button>
      </div>
    </div>
  )
}
