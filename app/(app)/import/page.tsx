"use client"
import { useState } from "react"
import { CashflowUploader } from "@/components/import/cashflow-uploader"
import { PaymentCodesUploader } from "@/components/import/payment-codes-uploader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ImportPage() {
  const [cfDone, setCfDone] = useState(false)
  const [pcDone, setPcDone] = useState(false)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Importar Dados</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Faça o upload do fluxo de caixa e dos códigos de pagamento para começar a simular.
        </p>
      </div>

      {/* Step 1 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#002468] text-xs font-bold text-white">1</span>
                Fluxo de Caixa
              </CardTitle>
              <CardDescription className="mt-1">
                Planilha com aba &quot;FLUXO Caixa&quot; — Colunas: A (Data), K (Receber), L (Pagar), M (Saldo)
              </CardDescription>
            </div>
            {cfDone && <CheckCircle className="h-6 w-6 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent>
          <CashflowUploader onSuccess={() => setCfDone(true)} />
        </CardContent>
      </Card>

      {/* Step 2 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#002468] text-xs font-bold text-white">2</span>
                Códigos de Pagamento
              </CardTitle>
              <CardDescription className="mt-1">
                Planilha com Código, Condição de Pagamento, Parcelas e Tipo
              </CardDescription>
            </div>
            {pcDone && <CheckCircle className="h-6 w-6 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent>
          <PaymentCodesUploader onSuccess={() => setPcDone(true)} />
        </CardContent>
      </Card>

      {/* Next step */}
      {cfDone && (
        <div className="flex justify-end">
          <Link href="/scenarios">
            <Button className="bg-[#099CD6] hover:bg-[#099CD6]/90 text-white">
              Criar Cenário
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
