@echo off
setlocal

cd /d "%~dp0"
set yuid=%cd%
set yuic=java -jar %cd%\yuicompressor\yuicompressor.jar --type js --preserve-semi --verbose
rem -- verbose

@echo on

pushd ..\src

set file=..\web\common\akme-core
@echo off
echo>"%file%.src.js" // %file%
for %%a in (akme-core.js akme-context.js akme-dom.js akme-more.js akme-storage.js akme-couch.js) ^
do type>>"%file%.src.js" "%%a"
%yuic% 2>"%yuid%\%~n0_.log" 1>"%file%.min.js" "%file%.src.js"
cscript.exe //nologo "%yuid%\%~n0.js" <"%yuid%\%~n0_.log" >"%yuid%\%~n0.log" && del /f /q "%yuid%\%~n0_.log"
@echo on

popd

@echo off
endlocal
if not "%1"=="NOPAUSE" pause
