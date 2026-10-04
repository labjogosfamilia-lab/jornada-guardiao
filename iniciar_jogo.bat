@echo off
title Jornada: O Guardiao dos Bosques - Servidor Local
echo ========================================================
echo   Iniciando o jogo localmente...
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
