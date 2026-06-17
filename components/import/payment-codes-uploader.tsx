"use client"
import { useState, useCallback } from "react"
import { Upload, Tag, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Props {
  onSuccess?: (count: number) => void
}

export function PaymentCodesUploader({ onSuccess }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [count, setCount] = useState(0)

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
      const res = await fetch("/api/payment-codes", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro")
      setStatus("success")
      setCount(data.count)
      toast.success(`${data.count} códigos importados!`)
      onSuccess?.(data.count)
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
          <Tag className="h-12 w-12 text-[#099CD6]" />
        )}

        <div className="text-center">
          {status === "success" ? (
            <>
              <p className="font-semibold text-green-700">Códigos importados!</p>
              <p className="text-sm text-muted-foreground">{count} códigos carregados</p>
            </>
          ) : (
            <>
              <p className="font-semibold">Arraste os Códigos de Pagamento</p>
              <p className="text-sm text-muted-foreground">Planilha com Código, Descrição, Tipo</p>
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
