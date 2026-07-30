@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d E:\project\HomeAssignment\frontend
call "C:\Program Files\nodejs\npm.cmd" install 2>&1
echo EXIT_CODE=%ERRORLEVEL%
