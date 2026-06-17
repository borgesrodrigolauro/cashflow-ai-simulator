import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/db"
import { buildSessionCookie } from "@/lib/session"

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/cashflow_session=([^;]+)/)
  const existing = match?.[1]

  if (existing) {
    const session = await prisma.session.findUnique({ where: { id: existing } })
    if (session) {
      return NextResponse.json({ sessionId: session.id })
    }
  }

  const session = await prisma.session.create({ data: { id: uuidv4() } })
  const res = NextResponse.json({ sessionId: session.id })
  res.headers.set("Set-Cookie", buildSessionCookie(session.id))
  return res
}

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/cashflow_session=([^;]+)/)
  const sessionId = match?.[1]

  if (!sessionId) return NextResponse.json({ sessionId: null })

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { cashflow: true, paymentCodes: true, scenarios: true },
  })

  return NextResponse.json({ sessionId: session?.id ?? null, hasData: !!session?.cashflow })
}
