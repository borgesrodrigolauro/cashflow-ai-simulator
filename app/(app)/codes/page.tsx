"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

type PaymentCode = {
  id: string
  code: string
  description: string
  category: string | null
  type: string
  parcelas: number
}

type FormState = {
  code: string
  description: string
  category: string
  type: "receita" | "despesa"
  parcelas: number
}

const EMPTY_FORM: FormState = {
  code: "",
  description: "",
  category: "Compras",
  type: "despesa",
  parcelas: 1,
}

export default function CodesPage() {
  const [codes, setCodes] = useState<PaymentCode[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"todos" | "receita" | "despesa">("todos")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PaymentCode | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<PaymentCode | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/payment-codes")
    const data = await res.json()
    setCodes(data.codes ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(c: PaymentCode) {
    setEditTarget(c)
    setForm({
      code: c.code,
      description: c.description,
      category: c.category ?? "Compras",
      type: c.type as "receita" | "despesa",
      parcelas: c.parcelas,
    })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.code.trim() || !form.description.trim()) {
      toast.error("Código e descrição são obrigatórios")
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        const res = await fetch(`/api/payment-codes/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: form.description,
            category: form.category,
            type: form.type,
            parcelas: form.parcelas,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        toast.success("Código atualizado")
      } else {
        const res = await fetch("/api/payment-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        toast.success("Código criado")
      }
      setDialogOpen(false)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const res = await fetch(`/api/payment-codes/${deleteTarget.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Código removido")
      setDeleteTarget(null)
      await load()
    } else {
      toast.error("Erro ao remover código")
    }
  }

  const filtered = codes.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "todos" || c.type === filterType
    return matchSearch && matchType
  })

  const categories = Array.from(new Set(codes.map((c) => c.category ?? "Outros"))).sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Códigos de Pagamento</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {codes.length} códigos cadastrados — selecione um ao criar um cenário de simulação.
          </p>
        </div>
        <Button onClick={openNew} className="bg-[#002468] hover:bg-[#002468]/90 text-white">
          <Plus className="h-4 w-4" />
          Novo Código
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar código ou descrição..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="despesa">Despesa</SelectItem>
            <SelectItem value="receita">Receita</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Código</th>
                <th className="px-4 py-3 text-left font-medium">Descrição</th>
                <th className="px-4 py-3 text-left font-medium">Categoria</th>
                <th className="px-4 py-3 text-center font-medium">Parcelas</th>
                <th className="px-4 py-3 text-center font-medium">Tipo</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-semibold text-[#002468]">{c.code}</td>
                  <td className="px-4 py-2.5">{c.description}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.category ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center">{c.parcelas}x</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge
                      variant="outline"
                      className={
                        c.type === "receita"
                          ? "border-green-500 text-green-600"
                          : "border-red-400 text-red-600"
                      }
                    >
                      {c.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum código encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar Código" : "Novo Código de Pagamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input
                value={form.code}
                disabled={!!editTarget}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="Ex: 30B"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ex: 30/60/90 DDL"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...categories, "Outros"].filter((v, i, a) => a.indexOf(v) === i).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as "receita" | "despesa" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Número de Parcelas</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.parcelas}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parcelas: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-[#002468] hover:bg-[#002468]/90 text-white"
            >
              {saving ? "Salvando..." : editTarget ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Código</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem certeza que deseja remover o código{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.code}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
