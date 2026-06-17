import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "./db"

const SESSION_COOKIE = "cashflow_session"

export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(SESSION_COOKIE)?.value

  if (existing) {
    const session = await prisma.session.findUnique({ where: { id: existing } })
    if (session) return session.id
  }

  const session = await prisma.session.create({ data: { id: uuidv4() } })
  return session.id
}

export async function getSessionFromRequest(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
  return match?.[1] ?? null
}

export function buildSessionCookie(sessionId: string): string {
  const maxAge = 30 * 24 * 60 * 60 // 30 days
  return `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`
}
