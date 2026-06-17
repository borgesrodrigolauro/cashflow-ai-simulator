import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { simulate } from "@/lib/simulation"
import { analyzeWithAI } from "@/lib/ai"
import type { CashflowEntry, SimulationEntry } from "@/lib/types"

function getSession(req: Request): string | null {
  return req.headers.get("cookie")?.match(/cashflow_session=([^;]+)/)?.[1] ?? null
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionId = getSession(req)
  if (!sessionId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const scenario = await prisma.scenario.findFirst({ where: { id, sessionId } })
  if (!scenario) return NextResponse.json({ error: "Cenário não encontrado" }, { status: 404 })

  const cashflow = await prisma.cashflowData.findUnique({ where: { sessionId } })
  if (!cashflow) return NextResponse.json({ error: "Fluxo de caixa não importado" }, { status: 400 })

  const originalEntries = cashflow.entries as unknown as CashflowEntry[]
  const simulationEntries = scenario.entries as unknown as SimulationEntry[]

  const result = simulate(originalEntries, simulationEntries)

  let aiAnalysis = null
  try {
    aiAnalysis = await analyzeWithAI(result, simulationEntries)
  } catch (err) {
    console.error("AI analysis failed:", err)
  }

  type JsonValue = import("@prisma/client").Prisma.InputJsonValue
  await prisma.scenario.update({
    where: { id },
    data: {
      result: result as unknown as JsonValue,
      aiAnalysis: aiAnalysis as unknown as JsonValue ?? null,
    },
  })

  return NextResponse.json({ result, aiAnalysis })
}
