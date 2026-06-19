# Ambiente de desenvolvimento — CashFlow AI Simulator

Set-Location $PSScriptRoot

# Verifica .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host ""
    Write-Host "[AVISO] Arquivo .env.local nao encontrado." -ForegroundColor Yellow
    Write-Host "        Copie .env.example para .env.local e preencha as variaveis:" -ForegroundColor Yellow
    Write-Host "        - DATABASE_URL" -ForegroundColor Yellow
    Write-Host "        - DIRECT_URL" -ForegroundColor Yellow
    Write-Host "        - ANTHROPIC_API_KEY" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Instala dependencias se necessario
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] node_modules nao encontrado. Instalando dependencias..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar dependencias." -ForegroundColor Red
        exit 1
    }
}

# Sobe o servidor
Write-Host ""
Write-Host "[DEV] Iniciando servidor Next.js em http://localhost:3000" -ForegroundColor Green
Write-Host ""
npm run dev
