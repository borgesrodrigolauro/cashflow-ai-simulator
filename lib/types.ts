export interface CashflowEntry {
  date: string
  documento?: string
  fornecedor?: string
  classeFinanceira?: string
  centroCusto?: string
  status?: string
  receber: number
  pagar: number
  saldo: number
}

export interface DailyCashflow {
  date: string
  receber: number
  pagar: number
  saldo: number
  saldoAcumulado: number
  isSimulated?: boolean
}

export interface PaymentCode {
  id?: string
  code: string
  description: string
  category?: string
  type: "receita" | "despesa"
  parcelas?: number
}

export interface SimulationEntry {
  id?: string
  paymentCode: string
  description: string
  value: number
  type: "receita" | "despesa"
  startDate: string
  installments: number
  intervalDays: number
}

export interface FlowIndicators {
  minBalance: number
  maxBalance: number
  avgBalance: number
  negativeDays: number
  worstDay: { date: string; balance: number }
  bestDay: { date: string; balance: number }
  totalReceber: number
  totalPagar: number
  currentBalance: number
}

export interface SimulationResult {
  originalFlow: DailyCashflow[]
  simulatedFlow: DailyCashflow[]
  indicators: {
    original: FlowIndicators
    simulated: FlowIndicators
  }
}

export type HealthScore = "Excelente" | "Boa" | "Atenção" | "Crítica"

export interface AIAnalysis {
  healthScore: HealthScore
  healthJustification: string
  bestPaymentDates: Array<{ date: string; reason: string }>
  bestStrategy: string
  strategies: string[]
  alerts: string[]
  diagnosis: string
  risks: string[]
  opportunities: string[]
  recommendations: string[]
}

export interface Scenario {
  id: string
  sessionId: string
  name: string
  description?: string
  entries: SimulationEntry[]
  result?: SimulationResult
  aiAnalysis?: AIAnalysis
  createdAt: string
  updatedAt: string
}

export interface CashflowUpload {
  id: string
  sessionId: string
  filename: string
  entries: CashflowEntry[]
  uploadedAt: string
}
