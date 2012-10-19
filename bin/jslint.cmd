@echo off
setlocal

cd /d "%~dp0"

@echo on
rem Windows CMD is unfriendly with nested " so use ' here and convert to " later in JS.
set opts={'maxerr':1000,'white':true}
cscript //nologo "%~n0.js" "..\web\common\akme-core.src.js" "%opts%" >"%~n0.html"
@echo off

popd

endlocal
pause