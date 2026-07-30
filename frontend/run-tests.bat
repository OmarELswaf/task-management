@echo off
set PATH=C:\PROGRA~1\nodejs;%PATH%
cd /d E:\project\HomeAssignment\frontend
"C:\PROGRA~1\nodejs\node.exe" ".\node_modules\vitest\vitest.mjs" run --reporter verbose
echo EXIT_CODE=%ERRORLEVEL%
