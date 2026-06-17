import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    await prisma.$connect()
    const count = await prisma.session.count()
    return NextResponse.json({ ok: true, sessions: count, db: process.env.DATABASE_URL?.slice(0, 60) + "..." })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg, db: process.env.DATABASE_URL?.slice(0, 60) + "..." }, { status: 500 })
  }
}
