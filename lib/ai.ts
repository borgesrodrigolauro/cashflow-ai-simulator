import Anthropic from "@anthropic-ai/sdk"
import type { SimulationResult, AIAnalysis, SimulationEntry, HealthScore } from "./types"
import { formatCurrency, formatDate } from "./utils"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function analyzeWithAI(
  result: SimulationResult,
  simulationEntries: SimulationEntry[]
): Promise<AIAnalysis> {
  const { originalFlow, simulatedFlow, indicators } = result
  const orig = indicators.original
  const sim = indicators.simulated

  const entrySummary = simulationEntries
    .map(
      (e) =>
        `- ${e.description} (${e.type === "receita" ? "Receita" : "Despesa"}): ` +
        `${formatCurrency(e.value)} em ${e.installments}x a cada ${e.intervalDays} dias, ` +
        `início em ${formatDate(e.startDate)}`
    )
    .join("\n")

  const top10Worst = [...simulatedFlow]
    .sort((a, b) => a.saldoAcumulado - b.saldoAcumulado)
    .slice(0, 5)
    .map((d) => `${formatDate(d.date)}: ${formatCurrency(d.saldoAcumulado)}`)
    .join(", ")

  const prompt = `Você é um consultor sênior de tesouraria e capital de giro. Analise o fluxo de caixa e forneça diagnóstico detalhado.

## FLUXO ATUAL
- Saldo mínimo: ${formatCurrency(orig.minBalance)}
- Saldo máximo: ${formatCurrency(orig.maxBalance)}
- Saldo médio: ${formatCurrency(orig.avgBalance)}
- Dias negativos: ${orig.negativeDays}
- Total a receber: ${formatCurrency(orig.totalReceber)}
- Total a pagar: ${formatCurrency(orig.totalPagar)}
- Pior dia: ${formatDate(orig.worstDay.date)} (${formatCurrency(orig.worstDay.balance)})
- Melhor dia: ${formatDate(orig.bestDay.date)} (${formatCurrency(orig.bestDay.balance)})

## SIMULAÇÃO PROPOSTA
${entrySummary}

## FLUXO SIMULADO
- Saldo mínimo: ${formatCurrency(sim.minBalance)}
- Saldo máximo: ${formatCurrency(sim.maxBalance)}
- Saldo médio: ${formatCurrency(sim.avgBalance)}
- Dias negativos: ${sim.negativeDays}
- Total a receber: ${formatCurrency(sim.totalReceber)}
- Total a pagar: ${formatCurrency(sim.totalPagar)}
- Pior dia: ${formatDate(sim.worstDay.date)} (${formatCurrency(sim.worstDay.balance)})
- Melhor dia: ${formatDate(sim.bestDay.date)} (${formatCurrency(sim.bestDay.balance)})
- 5 piores dias simulados: ${top10Worst}

## VARIAÇÕES
- Δ Saldo mínimo: ${formatCurrency(sim.minBalance - orig.minBalance)}
- Δ Dias negativos: ${sim.negativeDays - orig.negativeDays}
- Δ Saldo médio: ${formatCurrency(sim.avgBalance - orig.avgBalance)}

Responda EXCLUSIVAMENTE em JSON válido com a estrutura abaixo (sem markdown, sem texto fora do JSON):
{
  "healthScore": "Excelente|Boa|Atenção|Crítica",
  "healthJustification": "justificativa em 2 frases",
  "bestPaymentDates": [
    {"date": "YYYY-MM-DD", "reason": "motivo"},
    {"date": "YYYY-MM-DD", "reason": "motivo"},
    {"date": "YYYY-MM-DD", "reason": "motivo"}
  ],
  "bestStrategy": "estratégia recomendada em 1 parágrafo",
  "strategies": ["estratégia 1", "estratégia 2", "estratégia 3"],
  "alerts": ["alerta 1", "alerta 2"],
  "diagnosis": "diagnóstico completo em 3-4 frases",
  "risks": ["risco 1", "risco 2", "risco 3"],
  "opportunities": ["oportunidade 1", "oportunidade 2"],
  "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3", "recomendação 4"]
}`

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"

  try {
    const parsed = JSON.parse(text) as AIAnalysis
    const validScores: HealthScore[] = ["Excelente", "Boa", "Atenção", "Crítica"]
    if (!validScores.includes(parsed.healthScore)) {
      parsed.healthScore =
        sim.negativeDays > 5
          ? "Crítica"
          : sim.negativeDays > 0
            ? "Atenção"
            : sim.minBalance > 50000
              ? "Excelente"
              : "Boa"
    }
    return parsed
  } catch {
    return buildFallbackAnalysis(result)
  }
}

function buildFallbackAnalysis(result: SimulationResult): AIAnalysis {
  const sim = result.indicators.simulated
  const score: HealthScore =
    sim.negativeDays > 5
      ? "Crítica"
      : sim.negativeDays > 0
        ? "Atenção"
        : sim.minBalance > 50000
          ? "Excelente"
          : "Boa"

  return {
    healthScore: score,
    healthJustification: `O fluxo simulado apresenta ${sim.negativeDays} dias com saldo negativo. Saldo médio projetado: ${formatCurrency(sim.avgBalance)}.`,
    bestPaymentDates: [],
    bestStrategy:
      sim.negativeDays > 0
        ? "Recomendamos parcelamento para diluir o impacto e evitar saldo negativo."
        : "O caixa suporta o pagamento. Avalie desconto à vista para reduzir custo total.",
    strategies: ["Parcelar em 3x", "Postergar 30 dias", "Antecipar recebíveis"],
    alerts:
      sim.negativeDays > 0
        ? [`${sim.negativeDays} dias com saldo negativo detectados`]
        : [],
    diagnosis: `Fluxo analisado com ${result.simulatedFlow.length} dias de projeção.`,
    risks: sim.negativeDays > 0 ? ["Risco de cheque especial ou atraso de pagamentos"] : [],
    opportunities: ["Negociar prazo com fornecedores", "Antecipar recebíveis de clientes"],
    recommendations: [
      "Monitorar saldo diário",
      "Manter reserva de capital de giro",
      "Negociar melhores prazos",
    ],
  }
}
