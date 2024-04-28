@echo off
rem Prepare and run a diskpart script.
rem https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-vista/cc766465(v=ws.10)?redirectedfrom=MSDN
rem Interesting to only auto-online fixed disks: help SAN
rem
rem Also note how to convert Drive Properties "Location information" to a diskpart disk=<path>.
rem Use Device Manager with View: Devices by Connection and find the Location Paths Details of the controller.
rem Then use this reference to create the PnP Location Path.
rem https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/hard-disk-location-path-format?view=windows-11
rem <PnP location path of the adapter>#<Bus Type>(C<Channel ID>T<Target ID>L<LUN ID>)
rem #<Bus Type> is #ATA for SATA.
rem Other info...
rem https://serverfault.com/questions/103629/windows-equivalent-for-lspci
rem https://superuser.com/questions/1146392/powershell-pci-pcie-slot-occupation/1426644#1426644

rem An implied endlocal happens on script end, :EOF.
setlocal

rem Handle situations where the CmdCmdLine already includes the name of the script and arguments.
echo %CmdCmdLine% | find /c /i "diskpart-script" 1>nul
set CmdLineNoArgs=%ErrorLevel%
if %CmdLineNoArgs% == 0 (echo %CmdCmdLine%) else (echo %CmdCmdLine% %~dpnx0 %1 %2 %3)

set ScriptFile=%~dpn0.txt
set SysSync=C:\Util\SysInternals\sync.exe

if not "%1" == "" set DiskLetter=%1
if defined DiskLetter set ScriptCmd=%2
if /i "%DiskLetter%" == "J" set DiskPath=PCIROOT(0)#PCI(1100)#ATA(C02T00L00)
if defined DiskPath goto :%ScriptCmd%
goto :EOF

:offline
rem Use SysInternals sync to flush write caches but then diskpart takes time to start.
rem PowerShell has a better alternative with Write-VolumeCache.
%SysSync% -nobanner %DiskLetter%
echo>"%ScriptFile%" rem Prepare diskpart script to offline the disk related to J.
goto :diskpart

:online
echo>"%~dpn0.txt" rem Prepare diskpart script to online the disk related to J.
goto :diskpart

:diskpart
echo>>"%ScriptFile%" list disk
echo>>"%ScriptFile%" select disk=%DiskPath%
echo>>"%~dpn0.txt" %ScriptCmd% disk
echo>>"%~dpn0.txt" exit
diskpart.exe /s "%~dpn0.txt"
if %CmdLineNoArgs% == 0 pause
