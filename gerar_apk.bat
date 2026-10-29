@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Gerador de APK - ESA GESTOR
color 0B

echo =======================================================
echo          GERADOR AUTOMATICO DE APK - ESA GESTOR
echo =======================================================
echo.
echo [1/3] Construindo o aplicativo web (Next.js)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao fazer o build web.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Sincronizando arquivos estaticos com o Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao sincronizar arquivos com a pasta Android.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Compilando o APK via Gradle (Pode demorar alguns minutos)...
cd android

:: Verifica se o local.properties existe. Se não, tenta criar automaticamente.
:: Também apaga se o arquivo estiver corrompido (com espaços no final).
if exist "local.properties" (
    findstr /c:"Sdk " "local.properties" >nul
    if %errorlevel% equ 0 (
        del "local.properties"
    )
)

if not exist "local.properties" (
    echo [INFO] Configurando local.properties...
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "SDK_PATH=%LOCALAPPDATA%\Android\Sdk"
        set "SDK_PATH=!SDK_PATH:\=/!"
        >local.properties echo sdk.dir=!SDK_PATH!
        echo [OK] Caminho do SDK configurado para %LOCALAPPDATA%\Android\Sdk
    ) else (
        echo [ERRO] O Android SDK nao foi encontrado no caminho padrao do Windows.
        echo Por favor, abra a pasta "android" com o Android Studio pelo menos uma vez para configurar o SDK.
        cd ..
        pause
        exit /b 1
    )
)

call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao gerar o APK. Verifique se o Java e o Android SDK estao configurados.
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo =======================================================
echo                     SUCESSO!
echo =======================================================
echo O seu arquivo APK foi gerado com sucesso!
echo Voce pode encontrar o arquivo "app-debug.apk" na pasta:
echo.
echo %CD%\android\app\build\outputs\apk\debug\
echo.
echo Agora e so copiar esse arquivo para o celular e instalar.
echo =======================================================
pause
