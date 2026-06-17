import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function getSession(req: Request): string | null {
  return req.headers.get("cookie")?.match(/cashflow_session=([^;]+)/)?.[1] ?? null
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionId = getSession(req)
  if (!sessionId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const scenario = await prisma.scenario.findFirst({ where: { id, sessionId } })
  if (!scenario) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  return NextResponse.json({ scenario })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionId = getSession(req)
  if (!sessionId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const scenario = await prisma.scenario.updateMany({
    where: { id, sessionId },
    data: {
      name: body.name,
      description: body.description,
      entries: body.entries,
    },
  })

  return NextResponse.json({ updated: scenario.count })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionId = getSession(req)
  if (!sessionId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  await prisma.scenario.deleteMany({ where: { id, sessionId } })
  return NextResponse.json({ deleted: true })
}
