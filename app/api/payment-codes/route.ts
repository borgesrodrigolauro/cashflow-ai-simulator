import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { PAYMENT_CODES_SEED } from "@/lib/payment-codes-seed"
import { v4 as uuidv4 } from "uuid"
import { buildSessionCookie } from "@/lib/session"

async function resolveSession(req: Request): Promise<{ sessionId: string; isNew: boolean }> {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/cashflow_session=([^;]+)/)
  const existing = match?.[1]
  if (existing) {
    const s = await prisma.session.findUnique({ where: { id: existing } })
    if (s) return { sessionId: s.id, isNew: false }
  }
  const s = await prisma.session.create({ data: { id: uuidv4() } })
  return { sessionId: s.id, isNew: true }
}

async function ensureSeeded(sessionId: string) {
  const count = await prisma.paymentCode.count({ where: { sessionId } })
  if (count === 0) {
    await prisma.paymentCode.createMany({
      data: PAYMENT_CODES_SEED.map((c) => ({
        id: uuidv4(),
        sessionId,
        code: c.code,
        description: c.description,
        category: c.category,
        type: c.type,
        parcelas: c.parcelas,
      })),
      skipDuplicates: true,
    })
  }
}

export async function GET(req: Request) {
  const { sessionId, isNew } = await resolveSession(req)

  await ensureSeeded(sessionId)

  const codes = await prisma.paymentCode.findMany({
    where: { sessionId },
    orderBy: [{ category: "asc" }, { code: "asc" }],
  })

  const res = NextResponse.json({ codes })
  if (isNew) res.headers.set("Set-Cookie", buildSessionCookie(sessionId))
  return res
}

export async function POST(req: Request) {
  try {
    const { sessionId, isNew } = await resolveSession(req)
    const body = await req.json()

    const { code, description, category, type, parcelas } = body as {
      code: string
      description: string
      category?: string
      type?: string
      parcelas?: number
    }

    if (!code?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Código e descrição são obrigatórios" }, { status: 400 })
    }

    const existing = await prisma.paymentCode.findUnique({
      where: { sessionId_code: { sessionId, code: code.trim().toUpperCase() } },
    })
    if (existing) {
      return NextResponse.json({ error: "Código já existe" }, { status: 409 })
    }

    const created = await prisma.paymentCode.create({
      data: {
        id: uuidv4(),
        sessionId,
        code: code.trim().toUpperCase(),
        description: description.trim(),
        category: category?.trim() ?? "Outros",
        type: (type === "receita" ? "receita" : "despesa") as "receita" | "despesa",
        parcelas: parcelas ?? 1,
      },
    })

    const res = NextResponse.json({ code: created })
    if (isNew) res.headers.set("Set-Cookie", buildSessionCookie(sessionId))
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erro ao criar código" }, { status: 500 })
  }
}
