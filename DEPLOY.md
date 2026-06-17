# Deploy — CashFlow AI Simulator

## Pré-requisitos
- Conta Supabase (supabase.com) — gratuita
- Conta Vercel (vercel.com) — gratuita
- Conta GitHub (github.com) — gratuita
- Chave API Anthropic (console.anthropic.com)

---

## PASSO 1 — Supabase (banco de dados)

1. Acesse **supabase.com** → New Project
2. Nome: `cashflow-ai`
3. Senha forte → anote!
4. Região: `South America (São Paulo)`
5. Aguarde criar (~2 min)
6. Vá em **Settings → Database**
7. Copie:
   - **Connection string (Transaction)** → será o `DATABASE_URL`  
     Substitua `[YOUR-PASSWORD]` pela senha criada
   - **Connection string (Session)** → será o `DIRECT_URL`

---

## PASSO 2 — Configurar banco

No terminal, dentro da pasta do projeto:

```bash
# Criar arquivo .env.local com suas credenciais
DATABASE_URL="postgresql://postgres:[SENHA]@db.[REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres"
ANTHROPIC_API_KEY="sk-ant-..."

# Rodar migration
npx prisma db push
```

---

## PASSO 3 — GitHub

```bash
# 1. Criar repositório no github.com (New Repository → cashflow-ai-simulator)
# 2. Copiar a URL do repo (ex: https://github.com/seuperfil/cashflow-ai-simulator.git)

# No terminal dentro do projeto:
git remote add origin https://github.com/SEU_USUARIO/cashflow-ai-simulator.git
git branch -M main
git push -u origin main
```

---

## PASSO 4 — Vercel Deploy

```bash
# Instalar Vercel CLI (já feito)
vercel login

# Deploy
cd cashflow-ai-simulator
vercel

# Seguir as perguntas:
# - Link to existing project? N
# - Project name: cashflow-ai-simulator
# - Root directory: ./
# - Override settings? N

# Depois de fazer deploy, adicionar variáveis:
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add ANTHROPIC_API_KEY

# Re-deploy com variáveis
vercel --prod
```

---

## Alternativa: Deploy pelo painel Vercel (sem CLI)

1. Acesse **vercel.com** → Import Project → Import from GitHub
2. Selecione o repositório `cashflow-ai-simulator`
3. Vá em **Settings → Environment Variables** e adicione:
   - `DATABASE_URL` = connection string Supabase (pooled)
   - `DIRECT_URL` = connection string Supabase (direct)
   - `ANTHROPIC_API_KEY` = sua chave Anthropic
4. Clique **Redeploy**

---

## URL Final

Após o deploy, o Vercel fornece uma URL como:
`https://cashflow-ai-simulator-xxx.vercel.app`
