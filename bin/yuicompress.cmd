@echo off
setlocal

cd /d "%~dp0"
set yuic=java -jar %cd%\yuicompressor\yuicompressor.jar --type js --preserve-semi

@echo on

pushd ..\src

set file=..\web\common\akme-core.min.js
@echo off
echo>"%file%" // %file%
for %%a in (akme-core.js akme-dom.js akme-more.js akme-storage.js akme-context.js) ^
do type>>"%file%.src.js" "%%a"
%yuic% >>"%file%" "%file%.src.js"
del /q "%file%.src.js"
@echo on

popd

@echo off 
endlocal
pause
