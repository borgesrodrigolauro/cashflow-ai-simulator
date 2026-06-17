import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function getSession(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") ?? ""
  return cookieHeader.match(/cashflow_session=([^;]+)/)?.[1] ?? null
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionId = getSession(req)
  if (!sessionId) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { description, category, type, parcelas } = body as {
    description?: string
    category?: string
    type?: string
    parcelas?: number
  }

  const record = await prisma.paymentCode.findFirst({ where: { id, sessionId } })
  if (!record) return NextResponse.json({ error: "Código não encontrado" }, { status: 404 })

  const updated = await prisma.paymentCode.update({
    where: { id },
    data: {
      ...(description ? { description: description.trim() } : {}),
      ...(category !== undefined ? { category: category.trim() } : {}),
      ...(type ? { type: type as "receita" | "despesa" } : {}),
      ...(parcelas !== undefined ? { parcelas } : {}),
    },
  })

  return NextResponse.json({ code: updated })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionId = getSession(req)
  if (!sessionId) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })

  const { id } = await params
  const record = await prisma.paymentCode.findFirst({ where: { id, sessionId } })
  if (!record) return NextResponse.json({ error: "Código não encontrado" }, { status: 404 })

  await prisma.paymentCode.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
