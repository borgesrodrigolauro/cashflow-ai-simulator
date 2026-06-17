"use client"
import { usePathname } from "next/navigation"

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/import": "Importar Dados",
  "/scenarios": "Cenários",
  "/compare": "Comparar Cenários",
}

export function Header() {
  const path = usePathname()
  const title = Object.entries(titles).find(([k]) => path.startsWith(k))?.[1] ?? "CashFlow AI"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-6 shadow-sm">
      <h1 className="text-lg font-semibold text-[#002468]">{title}</h1>
    </header>
  )
}
