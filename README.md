# CashFlow AI Simulator

Simulador inteligente de fluxo de caixa com IA — analisa impactos financeiros futuros sem lançar documentos no ERP.

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Node.js (Next.js API Routes)
- **Banco**: PostgreSQL via Supabase + Prisma ORM
- **IA**: Claude API (Anthropic)
- **Hospedagem**: Vercel

## Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 3. Migrar banco
npx prisma db push

# 4. Rodar
npm run dev
```

## Deploy Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configurar variáveis no painel Vercel:
#    DATABASE_URL, DIRECT_URL, ANTHROPIC_API_KEY
```

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string Supabase (pooled) |
| `DIRECT_URL` | Connection string Supabase (direct) |
| `ANTHROPIC_API_KEY` | Chave da API Claude |

## Estrutura da Planilha de Entrada

**Fluxo de Caixa** (aba `FLUXO Caixa`):
- Coluna A: Vencimento (data)
- Coluna K: A RECEBER
- Coluna L: A PAGAR  
- Coluna M: SALDO

**Códigos de Pagamento**:
- Coluna 1: Código
- Coluna 2: Condição/Descrição
- Coluna 3: Parcelas
- Coluna 4: Tipo

## Funcionalidades

1. Upload do Fluxo de Caixa (Excel)
2. Upload dos Códigos de Pagamento
3. Criação de Cenários com lançamentos virtuais
4. Simulação de impacto no caixa
5. Análise IA: saúde, alertas, estratégias, recomendações
6. Comparativo Original × Simulado
7. Múltiplos cenários simultâneos
8. Exportação Excel + PDF
