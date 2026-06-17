import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { buildSessionCookie } from "@/lib/session"
import { v4 as uuidv4 } from "uuid"
import type { CashflowEntry } from "@/lib/types"

async function resolveSession(req: Request): Promise<string> {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/cashflow_session=([^;]+)/)
  const existing = match?.[1]

  if (existing) {
    const s = await prisma.session.findUnique({ where: { id: existing } })
    if (s) return s.id
  }

  const s = await prisma.session.create({ data: { id: uuidv4() } })
  return s.id
}

export async function POST(req: Request) {
  try {
    // Aceita JSON (entries já parseadas no browser) para evitar limite de tamanho de upload
    const body = await req.json() as { entries: CashflowEntry[]; filename: string; meta?: unknown }
    const { entries, filename, meta } = body

    if (!entries?.length) {
      return NextResponse.json(
        { error: "Nenhum dado encontrado na planilha. Verifique a aba e a estrutura do arquivo." },
        { status: 422 }
      )
    }

    const sessionId = await resolveSession(req)

    const cashflow = await prisma.cashflowData.upsert({
      where: { sessionId },
      create: { sessionId, filename, entries: entries as unknown as import("@prisma/client").Prisma.InputJsonValue },
      update: { filename, entries: entries as unknown as import("@prisma/client").Prisma.InputJsonValue, uploadedAt: new Date() },
    })

    const res = NextResponse.json({
      id: cashflow.id,
      filename: cashflow.filename,
      count: entries.length,
      preview: entries.slice(0, 5),
      meta,
    })

    const cookieHeader = req.headers.get("cookie") ?? ""
    const existingSession = cookieHeader.match(/cashflow_session=([^;]+)/)?.[1]
    if (!existingSession) {
      res.headers.set("Set-Cookie", buildSessionCookie(sessionId))
    }

    return res
  } catch (err) {
    console.error("cashflow upload error", err)
    return NextResponse.json({ error: "Erro ao processar planilha" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/cashflow_session=([^;]+)/)
  const sessionId = match?.[1]
  if (!sessionId) return NextResponse.json({ data: null })

  const cashflow = await prisma.cashflowData.findUnique({ where: { sessionId } })
  if (!cashflow) return NextResponse.json({ data: null })

  return NextResponse.json({
    data: {
      id: cashflow.id,
      filename: cashflow.filename,
      uploadedAt: cashflow.uploadedAt,
      entries: cashflow.entries,
    },
  })
}
