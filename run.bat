@echo off
setlocal
cd /d "%~dp0"

echo === OneMapan local dev ===

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not on PATH.
  exit /b 1
)

if not exist "backend\node_modules" (
  echo Installing backend dependencies...
  pushd backend && call npm install && popd
)
if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  pushd frontend && call npm install && popd
)

rem --- Backend environment (override any value by setting it before running) ---
if "%DATABASE_URL%"=="" set "DATABASE_URL=file:./onemapan.db"
if "%JWT_SECRET%"=="" set "JWT_SECRET=local-dev-only-secret-change-me-0123456789abcdef"
if "%PORT%"=="" set "PORT=2025"
if "%HOST%"=="" set "HOST=127.0.0.1"
if "%SERVER_BASE_URL%"=="" set "SERVER_BASE_URL=http://localhost:2025"
if "%ALLOWED_ORIGINS%"=="" set "ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000"
set "NEXT_PUBLIC_API_URL=http://localhost:2025"

rem --- First run: create/migrate/seed the SQLite database if missing ---
if not exist "backend\prisma\onemapan.db" (
  echo First run: applying migrations and seeding reference data...
  pushd backend
  call npx prisma generate
  call npx prisma migrate deploy
  call npm run seed
  call npm run admin
  popd
)

echo.
echo Backend : http://localhost:2025  (health: /healthz)
echo Frontend: http://localhost:3000
echo Stop each server by pressing Ctrl+C in its window.
echo.

start "OneMapan Backend"  /D "%~dp0backend"  cmd /k npm run dev

rem Next.js also reads PORT: give it its own value so it cannot steal 2025.
set "PORT=3000"
start "OneMapan Frontend" /D "%~dp0frontend" cmd /k npm run dev

rem ping is used as a portable delay (timeout fails in non-interactive shells)
ping -n 13 127.0.0.1 >nul
start "" http://localhost:3000
endlocal
