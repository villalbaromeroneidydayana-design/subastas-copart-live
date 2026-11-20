@echo off
title Copart VB3 Live - Servidor de Produccion
echo ==============================================================================
echo INICIANDO PLATAFORMA DE SUBASTAS COPART VB3 LIVE (PRODUCCION)
echo ==============================================================================
echo.

if not exist "dist\index.html" (
    echo Compilando aplicacion frontend para produccion...
    call npm run build
)

echo Iniciando servidor backend y transmision segura Cloudflare para celulares...
call npx tsx scripts/start-live-production.ts
pause

