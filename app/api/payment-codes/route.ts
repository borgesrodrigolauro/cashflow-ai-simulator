import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parsePaymentCodesExcel } from "@/lib/excel"
import { v4 as uuidv4 } from "uuid"
import { buildSessionCookie } from "@/lib/session"

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
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const codes = parsePaymentCodesExcel(buffer)

    if (!codes.length) {
      return NextResponse.json({ error: "Nenhum código encontrado" }, { status: 422 })
    }

    const sessionId = await resolveSession(req)

    // Limpar códigos anteriores e inserir novos
    await prisma.paymentCode.deleteMany({ where: { sessionId } })
    await prisma.paymentCode.createMany({
      data: codes.map((c) => ({
        sessionId,
        code: c.code,
        description: c.description,
        category: c.category ?? null,
        type: c.type,
        parcelas: c.parcelas ?? 1,
      })),
      skipDuplicates: true,
    })

    const res = NextResponse.json({ count: codes.length, preview: codes.slice(0, 5) })
    const cookieHeader = req.headers.get("cookie") ?? ""
    const existingSession = cookieHeader.match(/cashflow_session=([^;]+)/)?.[1]
    if (!existingSession) res.headers.set("Set-Cookie", buildSessionCookie(sessionId))
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erro ao processar arquivo" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/cashflow_session=([^;]+)/)
  const sessionId = match?.[1]
  if (!sessionId) return NextResponse.json({ codes: [] })

  const codes = await prisma.paymentCode.findMany({ where: { sessionId } })
  return NextResponse.json({ codes })
}
