import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { exportToExcel, exportToPDF } from "@/lib/export"
import type { CashflowEntry, SimulationEntry, SimulationResult, AIAnalysis } from "@/lib/types"
import { simulate } from "@/lib/simulation"

function getSession(req: Request): string | null {
  return req.headers.get("cookie")?.match(/cashflow_session=([^;]+)/)?.[1] ?? null
}

export async function POST(req: Request) {
  const sessionId = getSession(req)
  if (!sessionId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { scenarioId, format } = await req.json()

  const scenario = await prisma.scenario.findFirst({
    where: { id: scenarioId, sessionId },
  })
  if (!scenario) return NextResponse.json({ error: "Cenário não encontrado" }, { status: 404 })

  const cashflow = await prisma.cashflowData.findUnique({ where: { sessionId } })
  if (!cashflow) return NextResponse.json({ error: "Fluxo não encontrado" }, { status: 404 })

  const originalEntries = cashflow.entries as unknown as CashflowEntry[]
  const simulationEntries = scenario.entries as unknown as SimulationEntry[]
  const result: SimulationResult =
    (scenario.result as unknown as SimulationResult) ?? simulate(originalEntries, simulationEntries)
  const aiAnalysis = scenario.aiAnalysis as unknown as AIAnalysis | undefined

  const scenarioData = {
    id: scenario.id,
    sessionId: scenario.sessionId,
    name: scenario.name,
    description: scenario.description ?? undefined,
    entries: simulationEntries,
    result,
    aiAnalysis,
    createdAt: scenario.createdAt.toISOString(),
    updatedAt: scenario.updatedAt.toISOString(),
  }

  if (format === "pdf") {
    const pdf = await exportToPDF(scenarioData, result, aiAnalysis)
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cashflow-${scenario.name}.pdf"`,
      },
    })
  }

  const excel = await exportToExcel(scenarioData, result, aiAnalysis)
  return new NextResponse(excel as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="cashflow-${scenario.name}.xlsx"`,
    },
  })
}
