import type { SimulationResult, AIAnalysis, Scenario } from "./types"
import { formatCurrency, formatDate } from "./utils"

export async function exportToExcel(
  scenario: Scenario,
  result: SimulationResult,
  aiAnalysis?: AIAnalysis
): Promise<Buffer> {
  // Dynamic import to avoid SSR issues
  const ExcelJS = (await import("exceljs")).default

  const wb = new ExcelJS.Workbook()
  wb.creator = "CashFlow AI Simulator"
  wb.created = new Date()

  // Aba 1: Fluxo Comparativo
  const ws1 = wb.addWorksheet("Fluxo Comparativo")
  ws1.columns = [
    { header: "Data", key: "date", width: 14 },
    { header: "Receber (Original)", key: "origReceber", width: 22 },
    { header: "Pagar (Original)", key: "origPagar", width: 22 },
    { header: "Saldo (Original)", key: "origSaldo", width: 22 },
    { header: "Receber (Simulado)", key: "simReceber", width: 22 },
    { header: "Pagar (Simulado)", key: "simPagar", width: 22 },
    { header: "Saldo (Simulado)", key: "simSaldo", width: 22 },
  ]

  ws1.getRow(1).font = { bold: true }
  ws1.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF002468" },
  }
  ws1.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }

  const origMap = new Map(result.originalFlow.map((d) => [d.date, d]))
  const simMap = new Map(result.simulatedFlow.map((d) => [d.date, d]))
  const allDates = [...new Set([...origMap.keys(), ...simMap.keys()])].sort()

  for (const date of allDates) {
    const orig = origMap.get(date)
    const sim = simMap.get(date)
    const row = ws1.addRow({
      date: formatDate(date),
      origReceber: orig?.receber ?? 0,
      origPagar: orig?.pagar ?? 0,
      origSaldo: orig?.saldoAcumulado ?? 0,
      simReceber: sim?.receber ?? 0,
      simPagar: sim?.pagar ?? 0,
      simSaldo: sim?.saldoAcumulado ?? 0,
    })
    if (sim && (sim.receber > (orig?.receber ?? 0) || sim.pagar > (orig?.pagar ?? 0))) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } }
    }
    if ((sim?.saldoAcumulado ?? 0) < 0) {
      row.getCell("simSaldo").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEE2E2" },
      }
    }
  }

  // Aba 2: Indicadores
  const ws2 = wb.addWorksheet("Indicadores")
  ws2.getColumn("A").width = 30
  ws2.getColumn("B").width = 22
  ws2.getColumn("C").width = 22

  ws2.addRow(["Indicador", "Original", "Simulado"])
  ws2.getRow(1).font = { bold: true }

  const { original: o, simulated: s } = result.indicators
  const rows = [
    ["Saldo Mínimo", o.minBalance, s.minBalance],
    ["Saldo Máximo", o.maxBalance, s.maxBalance],
    ["Saldo Médio", o.avgBalance, s.avgBalance],
    ["Dias Negativos", o.negativeDays, s.negativeDays],
    ["Total a Receber", o.totalReceber, s.totalReceber],
    ["Total a Pagar", o.totalPagar, s.totalPagar],
    ["Pior Dia", formatDate(o.worstDay.date), formatDate(s.worstDay.date)],
    ["Melhor Dia", formatDate(o.bestDay.date), formatDate(s.bestDay.date)],
  ]
  for (const r of rows) ws2.addRow(r)

  // Aba 3: Análise IA
  if (aiAnalysis) {
    const ws3 = wb.addWorksheet("Análise IA")
    ws3.getColumn("A").width = 20
    ws3.getColumn("B").width = 80

    ws3.addRow(["Saúde Financeira", aiAnalysis.healthScore])
    ws3.addRow(["Justificativa", aiAnalysis.healthJustification])
    ws3.addRow([""])
    ws3.addRow(["Diagnóstico", aiAnalysis.diagnosis])
    ws3.addRow([""])
    ws3.addRow(["Melhor Estratégia", aiAnalysis.bestStrategy])
    ws3.addRow([""])
    ws3.addRow(["ALERTAS"])
    for (const a of aiAnalysis.alerts) ws3.addRow(["", a])
    ws3.addRow([""])
    ws3.addRow(["RISCOS"])
    for (const r of aiAnalysis.risks) ws3.addRow(["", r])
    ws3.addRow([""])
    ws3.addRow(["RECOMENDAÇÕES"])
    for (const r of aiAnalysis.recommendations) ws3.addRow(["", r])
  }

  const arrayBuffer = await wb.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

export async function exportToPDF(
  scenario: Scenario,
  result: SimulationResult,
  aiAnalysis?: AIAnalysis
): Promise<Buffer> {
  const { jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

  const navy = [0, 36, 104] as [number, number, number]
  const white = [255, 255, 255] as [number, number, number]

  doc.setFillColor(...navy)
  doc.rect(0, 0, 297, 25, "F")
  doc.setTextColor(...white)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("CASHFLOW AI SIMULATOR", 15, 16)
  doc.setFontSize(11)
  doc.text(`Cenário: ${scenario.name}`, 15, 23)

  doc.setTextColor(0, 0, 0)
  let y = 33

  // Indicadores
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("INDICADORES COMPARATIVOS", 15, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [["Indicador", "Original", "Simulado", "Variação"]],
    body: [
      [
        "Saldo Mínimo",
        formatCurrency(result.indicators.original.minBalance),
        formatCurrency(result.indicators.simulated.minBalance),
        formatCurrency(result.indicators.simulated.minBalance - result.indicators.original.minBalance),
      ],
      [
        "Saldo Máximo",
        formatCurrency(result.indicators.original.maxBalance),
        formatCurrency(result.indicators.simulated.maxBalance),
        formatCurrency(result.indicators.simulated.maxBalance - result.indicators.original.maxBalance),
      ],
      [
        "Saldo Médio",
        formatCurrency(result.indicators.original.avgBalance),
        formatCurrency(result.indicators.simulated.avgBalance),
        formatCurrency(result.indicators.simulated.avgBalance - result.indicators.original.avgBalance),
      ],
      [
        "Dias Negativos",
        String(result.indicators.original.negativeDays),
        String(result.indicators.simulated.negativeDays),
        String(result.indicators.simulated.negativeDays - result.indicators.original.negativeDays),
      ],
    ],
    headStyles: { fillColor: navy, textColor: white, fontStyle: "bold" },
    theme: "striped",
  })

  if (aiAnalysis) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("ANÁLISE IA — CONSULTOR DE TESOURARIA", 15, y)
    y += 5

    autoTable(doc, {
      startY: y,
      head: [["Campo", "Análise"]],
      body: [
        ["Saúde Financeira", aiAnalysis.healthScore],
        ["Diagnóstico", aiAnalysis.diagnosis],
        ["Melhor Estratégia", aiAnalysis.bestStrategy],
        ["Alertas", aiAnalysis.alerts.join("\n")],
        ["Riscos", aiAnalysis.risks.join("\n")],
        ["Recomendações", aiAnalysis.recommendations.join("\n")],
      ],
      headStyles: { fillColor: navy, textColor: white, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 220 } },
      theme: "grid",
    })
  }

  return Buffer.from(doc.output("arraybuffer"))
}
