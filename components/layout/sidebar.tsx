"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Upload, FlaskConical, GitCompare, TrendingUp,
} from "lucide-react"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/import", label: "Importar Dados", icon: Upload },
  { href: "/scenarios", label: "Cenários", icon: FlaskConical },
  { href: "/compare", label: "Comparar", icon: GitCompare },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-[#002468] text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-white/10 px-6 py-5">
        <TrendingUp className="h-7 w-7 text-[#099CD6]" />
        <div>
          <p className="text-sm font-bold leading-none tracking-wide">CASHFLOW AI</p>
          <p className="text-[10px] text-white/60 uppercase tracking-wider">Simulator</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              path === href || path.startsWith(href + "/")
                ? "bg-[#099CD6] text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-[10px] text-white/40">Powered by Claude AI</p>
      </div>
    </aside>
  )
}
