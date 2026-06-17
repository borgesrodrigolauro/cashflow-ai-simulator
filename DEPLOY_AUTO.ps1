# CashFlow AI Simulator — Deploy Automatico
# Execute este script no PowerShell como Administrador
# Instrucao: clique com botao direito no arquivo -> "Executar com PowerShell"

Set-Location "C:\Users\RodrigoBorges\Downloads\cashflow-ai-simulator"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CASHFLOW AI SIMULATOR — DEPLOY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── PASSO 1: GitHub ──────────────────────────────────────────────
Write-Host "PASSO 1/3 — GitHub" -ForegroundColor Yellow
Write-Host "Voce precisa de um Personal Access Token do GitHub."
Write-Host "Acesse: https://github.com/settings/tokens/new"
Write-Host "Selecione: repo (Full control of private repositories)"
Write-Host ""
$ghToken = Read-Host "Cole seu GitHub Token aqui"

$headers = @{
    Authorization = "token $ghToken"
    Accept = "application/vnd.github.v3+json"
}

$body = @{
    name = "cashflow-ai-simulator"
    description = "Simulador inteligente de fluxo de caixa com IA"
    private = $false
    auto_init = $false
} | ConvertTo-Json

Write-Host "Criando repositorio no GitHub..." -ForegroundColor Gray
$response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method POST -Headers $headers -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue

if ($response.html_url) {
    $repoUrl = $response.clone_url
    Write-Host "  Repositorio criado: $($response.html_url)" -ForegroundColor Green
} else {
    # Repo pode já existir
    $username = (Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers).login
    $repoUrl = "https://github.com/$username/cashflow-ai-simulator.git"
    Write-Host "  Usando repositorio existente: $repoUrl" -ForegroundColor Yellow
}

Write-Host "Fazendo push do codigo..." -ForegroundColor Gray
$repoUrlAuth = $repoUrl -replace "https://", "https://${ghToken}@"
git remote remove origin 2>$null
git remote add origin $repoUrlAuth
git branch -M main
git push -u origin main 2>&1 | Write-Host

Write-Host ""
Write-Host "  GitHub OK!" -ForegroundColor Green

# ── PASSO 2: Supabase (instruções) ───────────────────────────────
Write-Host ""
Write-Host "PASSO 2/3 — Supabase" -ForegroundColor Yellow
Write-Host ""
Write-Host "Acesse https://supabase.com e crie um projeto:"
Write-Host "  - Nome: cashflow-ai"
Write-Host "  - Regiao: South America (Sao Paulo)"
Write-Host "  - Anote a SENHA do banco"
Write-Host ""
Write-Host "Depois va em: Settings -> Database -> Connection String"
Write-Host "  - Transaction pooler (porta 6543) = DATABASE_URL"
Write-Host "  - Session pooler   (porta 5432) = DIRECT_URL"
Write-Host ""
$dbUrl = Read-Host "Cole o DATABASE_URL (Transaction pooler, porta 6543)"
$directUrl = Read-Host "Cole o DIRECT_URL (Session pooler, porta 5432)"

# Salvar no .env.local
$envContent = @"
DATABASE_URL="$dbUrl"
DIRECT_URL="$directUrl"
ANTHROPIC_API_KEY="$anthropicKey"
NEXT_PUBLIC_APP_URL="https://cashflow-ai-simulator.vercel.app"
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -Force
Write-Host "  .env.local atualizado" -ForegroundColor Green

Write-Host "Aplicando schema no banco..." -ForegroundColor Gray
$env:DATABASE_URL = $dbUrl
$env:DIRECT_URL = $directUrl
npx prisma db push --accept-data-loss 2>&1 | Write-Host
Write-Host "  Banco configurado!" -ForegroundColor Green

# ── PASSO 3: Vercel ──────────────────────────────────────────────
Write-Host ""
Write-Host "PASSO 3/3 — Vercel Deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "Fazendo login no Vercel (vai abrir o navegador)..."
vercel login

Write-Host ""
Write-Host "Iniciando deploy..." -ForegroundColor Gray

$env:DATABASE_URL = $dbUrl
$env:DIRECT_URL = $directUrl
$anthropicKey = Read-Host "Cole sua ANTHROPIC_API_KEY (sk-ant-...)"
$env:ANTHROPIC_API_KEY = $anthropicKey

# Criar projeto no Vercel com env vars
vercel env add DATABASE_URL production <<< $dbUrl
vercel env add DIRECT_URL production <<< $directUrl
vercel env add ANTHROPIC_API_KEY production <<< $anthropicKey

vercel --prod --yes 2>&1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acesse: https://cashflow-ai-simulator.vercel.app" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para fechar"
