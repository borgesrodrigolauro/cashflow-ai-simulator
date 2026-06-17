import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

function getSession(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") ?? ""
  return cookieHeader.match(/cashflow_session=([^;]+)/)?.[1] ?? null
}

export async function GET(req: Request) {
  const sessionId = getSession(req)
  if (!sessionId) return NextResponse.json({ scenarios: [] })

  const scenarios = await prisma.scenario.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ scenarios })
}

export async function POST(req: Request) {
  const sessionId = getSession(req)
  if (!sessionId) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })

  const body = await req.json()
  const { name, description, entries } = body

  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })

  const scenario = await prisma.scenario.create({
    data: {
      id: uuidv4(),
      sessionId,
      name,
      description: description ?? null,
      entries: entries ?? [],
    },
  })

  return NextResponse.json({ scenario })
}
