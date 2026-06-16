@echo off
chcp 65001 >nul
cd /d "%~dp0ponte-whatsapp"
echo ============================================
echo  Ponte WhatsApp - Fluxo de Ocorrencias
echo ============================================
echo Instalando/atualizando dependencia (pywhatkit)...
py -m pip install --no-cache-dir pywhatkit 2>nul || python -m pip install --no-cache-dir pywhatkit
echo.
echo Iniciando a ponte... deixe esta janela aberta.
py ponte.py 2>nul || python ponte.py
pause
