"use client"
import { AlertTriangle, CheckCircle, TrendingUp, Brain, Calendar, Lightbulb, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AIAnalysis } from "@/lib/types"
import { formatDate } from "@/lib/utils"

const healthConfig = {
  Excelente: { color: "bg-green-500", textColor: "text-green-700", border: "border-green-200 bg-green-50" },
  Boa: { color: "bg-blue-500", textColor: "text-blue-700", border: "border-blue-200 bg-blue-50" },
  Atenção: { color: "bg-yellow-500", textColor: "text-yellow-700", border: "border-yellow-200 bg-yellow-50" },
  Crítica: { color: "bg-red-500", textColor: "text-red-700", border: "border-red-200 bg-red-50" },
}

export function AIAnalysisPanel({ analysis }: { analysis: AIAnalysis }) {
  const hc = healthConfig[analysis.healthScore]

  return (
    <div className="space-y-4">
      {/* Health Score */}
      <Card className={`border-2 ${hc.border}`}>
        <CardContent className="flex items-center gap-4 py-5">
          <Brain className={`h-10 w-10 ${hc.textColor}`} />
          <div>
            <p className="text-xs font-medium text-muted-foreground">SAÚDE FINANCEIRA</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-3 w-3 rounded-full ${hc.color}`} />
              <span className={`text-2xl font-bold ${hc.textColor}`}>{analysis.healthScore}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{analysis.healthJustification}</p>
          </div>
        </CardContent>
      </Card>

      {/* Diagnóstico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-[#099CD6]" />
            Diagnóstico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{analysis.diagnosis}</p>
        </CardContent>
      </Card>

      {/* Alertas */}
      {analysis.alerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-0.5 text-red-500">⚠</span>
                {a}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Melhor Estratégia */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Melhor Estratégia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm">{analysis.bestStrategy}</p>
          <div className="flex flex-wrap gap-2">
            {analysis.strategies.map((s, i) => (
              <Badge key={i} variant="secondary">{s}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Melhores Datas */}
      {analysis.bestPaymentDates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-[#002468]" />
              Melhores Datas para Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.bestPaymentDates.map((d, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="font-mono">{formatDate(d.date)}</Badge>
                <span className="text-muted-foreground">{d.reason}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Riscos */}
      {analysis.risks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-orange-500" />
              Riscos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {analysis.risks.map((r, i) => (
              <p key={i} className="text-sm text-muted-foreground">• {r}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analysis.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-green-500 font-bold">{i + 1}.</span>
              {r}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
