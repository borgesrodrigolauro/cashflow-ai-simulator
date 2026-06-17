"use client"
import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Props {
  onSuccess?: (data: { count: number; filename: string }) => void
}

export function CashflowUploader({ onSuccess }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [info, setInfo] = useState<{ count: number; filename: string } | null>(null)

  const upload = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xls|xlsx)$/i)) {
      toast.error("Apenas arquivos .xls ou .xlsx são aceitos")
      return
    }
    setLoading(true)
    setStatus("idle")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/cashflow", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido")
      setStatus("success")
      setInfo({ count: data.count, filename: data.filename })
      toast.success(`${data.count} registros importados com sucesso!`)
      onSuccess?.({ count: data.count, filename: data.filename })
    } catch (err: unknown) {
      setStatus("error")
      toast.error(err instanceof Error ? err.message : "Erro ao importar")
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return (
    <Card
      className={cn(
        "cursor-pointer border-2 border-dashed transition-colors",
        dragging ? "border-[#099CD6] bg-blue-50" : "border-gray-200 hover:border-[#099CD6]",
        status === "success" && "border-green-400 bg-green-50",
        status === "error" && "border-red-400 bg-red-50"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) upload(f) }}
    >
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        {loading ? (
          <Loader2 className="h-12 w-12 animate-spin text-[#099CD6]" />
        ) : status === "success" ? (
          <CheckCircle className="h-12 w-12 text-green-500" />
        ) : status === "error" ? (
          <XCircle className="h-12 w-12 text-red-500" />
        ) : (
          <FileSpreadsheet className="h-12 w-12 text-[#099CD6]" />
        )}

        <div className="text-center">
          {status === "success" && info ? (
            <>
              <p className="font-semibold text-green-700">Importado com sucesso!</p>
              <p className="text-sm text-muted-foreground">{info.filename} — {info.count} registros</p>
            </>
          ) : (
            <>
              <p className="font-semibold">Arraste o Fluxo de Caixa aqui</p>
              <p className="text-sm text-muted-foreground">Aba: FLUXO Caixa — Cols A, K, L, M</p>
            </>
          )}
        </div>

        <label className="cursor-pointer">
          <Button variant="outline" size="sm" className="pointer-events-none" asChild>
            <span>
              <Upload className="h-4 w-4" />
              {status === "success" ? "Reimportar" : "Selecionar arquivo"}
            </span>
          </Button>
          <input
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = "" }}
          />
        </label>
      </CardContent>
    </Card>
  )
}
