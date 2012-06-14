@echo off
setlocal

cd /d "%~dp0"
set yuic=java -jar %cd%\yuicompressor\yuicompressor.jar --type js --preserve-semi

@echo on

pushd ..\src

set file=..\web\common\akme-core
@echo off
echo>"%file%.src.js" // %file%
for %%a in (akme-core.js akme-context.js akme-dom.js akme-more.js akme-storage.js) ^
do type>>"%file%.src.js" "%%a"
%yuic% >"%file%.min.js" "%file%.src.js"
@echo on

popd

@echo off
endlocal
pause
