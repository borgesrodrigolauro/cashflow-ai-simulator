"use client"
import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface ColumnMeta {
  index: number
  header: string
  detected: boolean
}

interface ParseMeta {
  sheetName: string
  availableSheets: string[]
  headerRowIndex: number
  totalDataRows: number
  columns: {
    date: ColumnMeta
    receber: ColumnMeta
    pagar: ColumnMeta
    saldo: ColumnMeta
  }
}

interface Props {
  onSuccess?: (data: { count: number; filename: string }) => void
}

function colLabel(idx: number): string {
  let result = ""
  let n = idx
  do {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return result
}

export function CashflowUploader({ onSuccess }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState("Processando...")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [info, setInfo] = useState<{ count: number; filename: string; meta?: ParseMeta } | null>(null)

  const upload = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xls|xlsx)$/i)) {
      toast.error("Apenas arquivos .xls ou .xlsx são aceitos")
      return
    }

    setLoading(true)
    setLoadingMsg("Lendo planilha...")
    setStatus("idle")

    try {
      // Processar Excel no navegador para evitar limite de tamanho no servidor
      const buffer = await file.arrayBuffer()

      setLoadingMsg("Detectando colunas...")
      const { parseCashflowExcel } = await import("@/lib/excel")
      const { entries, meta } = parseCashflowExcel(buffer)

      if (!entries.length) {
        throw new Error(
          `Nenhum dado encontrado. Verifique se a aba se chama "${meta.sheetName}" e se as colunas A, K, L, M existem.`
        )
      }

      setLoadingMsg(`Enviando ${entries.length} registros...`)

      // Envia só o JSON (sem o arquivo), sem limite de tamanho
      const res = await fetch("/api/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries, filename: file.name, meta }),
      })

      let data: Record<string, unknown>
      const ct = res.headers.get("content-type") ?? ""
      if (ct.includes("application/json")) {
        data = await res.json()
      } else {
        throw new Error(`Erro do servidor (${res.status})`)
      }

      if (!res.ok) throw new Error((data.error as string) ?? "Erro desconhecido")

      setStatus("success")
      setInfo({ count: data.count as number, filename: data.filename as string, meta })
      onSuccess?.({ count: data.count as number, filename: data.filename as string })

      const hasManualFallback = Object.entries(meta.columns).some(
        ([key, c]) => key !== "date" && !(c as ColumnMeta).detected
      )
      if (hasManualFallback) {
        toast.warning("Algumas colunas usaram posição padrão. Confira o mapeamento abaixo.")
      } else {
        toast.success(`${data.count} registros importados com sucesso!`)
      }
    } catch (err: unknown) {
      setStatus("error")
      toast.error(err instanceof Error ? err.message : "Erro ao importar planilha")
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  const meta = info?.meta
  const hasWarning = meta && Object.entries(meta.columns).some(
    ([key, c]) => key !== "date" && !(c as ColumnMeta).detected
  )

  return (
    <div className="space-y-3">
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
            {loading ? (
              <p className="font-semibold text-[#099CD6]">{loadingMsg}</p>
            ) : status === "success" && info ? (
              <>
                <p className="font-semibold text-green-700">Importado com sucesso!</p>
                <p className="text-sm text-muted-foreground">
                  {info.filename} — {info.count} registros
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Arraste o Fluxo de Caixa aqui</p>
                <p className="text-sm text-muted-foreground">Aba: FLUXO Caixa — Cols A, K, L, M</p>
              </>
            )}
          </div>

          {!loading && (
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
          )}
        </CardContent>
      </Card>

      {/* Mapeamento de colunas detectadas */}
      {meta && !loading && (
        <div className={cn(
          "rounded-lg border p-4 text-sm space-y-3",
          hasWarning ? "border-yellow-300 bg-yellow-50" : "border-green-200 bg-green-50"
        )}>
          <div className="flex items-center gap-2 font-medium">
            {hasWarning ? (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            ) : (
              <Info className="h-4 w-4 text-green-600" />
            )}
            <span className={hasWarning ? "text-yellow-800" : "text-green-800"}>
              Aba detectada: <strong>{meta.sheetName}</strong>
              {meta.availableSheets.length > 1 && (
                <span className="font-normal text-muted-foreground ml-1 text-xs">
                  (disponíveis: {meta.availableSheets.join(", ")})
                </span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                { key: "date", label: "Data" },
                { key: "receber", label: "A Receber" },
                { key: "pagar", label: "A Pagar" },
                { key: "saldo", label: "Saldo" },
              ] as const
            ).map(({ key, label }) => {
              const col = meta.columns[key] as ColumnMeta
              return (
                <div key={key} className="rounded border bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-mono font-bold text-[#002468]">{colLabel(col.index)}</span>
                    <span className="text-xs truncate max-w-[80px]" title={col.header}>
                      {col.header}
                    </span>
                    {key !== "date" && !col.detected && (
                      <Badge variant="outline" className="text-[10px] border-yellow-400 text-yellow-700 ml-auto shrink-0">
                        padrão
                      </Badge>
                    )}
                    {(key === "date" || col.detected) && (
                      <Badge variant="outline" className="text-[10px] border-green-400 text-green-700 ml-auto shrink-0">
                        auto
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {hasWarning && (
            <p className="text-xs text-yellow-700">
              Colunas &quot;padrão&quot; não foram encontradas pelo cabeçalho e usaram posição fixa.
              Verifique se a planilha tem os cabeçalhos &quot;A RECEBER&quot;, &quot;A PAGAR&quot; e &quot;SALDO&quot;.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
