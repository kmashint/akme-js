@echo off
rem Prepare and run a diskpart script.
rem		diskpart-script.cmd <DriveLetter> <online | offline>
rem e.g.	diskpart-script.cmd D online
rem
rem https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-vista/cc766465(v=ws.10)?redirectedfrom=MSDN
rem Interesting to only auto-online fixed disks: help SAN
rem
rem Also note how to convert Drive Properties "Location information" to a diskpart disk=<path>.
rem Use Device Manager with View: Devices by Connection and find the Location Paths Details of the controller.
rem Then use this reference to create the PnP Location Path.
rem https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/hard-disk-location-path-format?view=windows-11
rem For ATA/SATA Bus Type: <PnP location path of the adapter>#<Bus Type>(C<Channel ID>T<Target ID>L<LUN ID>)
rem For SCSI/SAS/RAID Bus Type: <PnP location path of the adapter>#<Bus Type>(P<Path ID>T<Target ID>L<LUN ID>)
rem Other info...
rem https://serverfault.com/questions/103629/windows-equivalent-for-lspci
rem https://superuser.com/questions/1146392/powershell-pci-pcie-slot-occupation/1426644#1426644
rem https://superuser.com/questions/1803222/how-to-find-out-pci-device-by-location-path
rem
rem Note problems removing old vdisks - there should be delete vdisk similar to delete disk.
rem https://learn.microsoft.com/en-us/answers/questions/138224/cant-remove-virtual-disks-completely?page=1#answers
rem PowerShell Get-VirtualDisk doesn't find any to use with Remove-VirtualDisk.

rem An implied endlocal happens on script end, :EOF.
setlocal

rem Handle situations where the CmdCmdLine already includes the name of the script and arguments.
echo %CmdCmdLine% | find /c /i "diskpart-script" 1>nul
set CmdLineNoArgs=%ErrorLevel%
if %CmdLineNoArgs% == 0 (echo %CmdCmdLine%) else (echo %CmdCmdLine% %~dpnx0 %1 %2 %3)

set ScriptFile=%~dpn0.txt
set SysSync=sync.exe

if not "%1" == "" set DiskLetter=%1
if defined DiskLetter set ScriptCmd=%2
rem This should work for USB-SCSI but doesn't? disk=PCIROOT(0)#PCI(0801)#PCI(0004)#USBROOT(0)#USB(5)#SAS(P00T00L00)
if /i "%DiskLetter%" == "D" set DiskPath=1
if defined DiskPath goto :%ScriptCmd%
goto :EOF

:offline
set IntroCmd=offlineIntro
echo>"%ScriptFile%" rem Prepare diskpart script to offline the disk related to %DiskLetter%.
goto :diskpart

:offlineIntro
rem Use SysInternals sync to flush write caches but then diskpart takes time to start.
rem PowerShell has a better alternative with Write-VolumeCache, but Mount-VHD requires a server.
%SysSync% -nobanner
if not exist "%DiskLetter%:\X-Drive.vhd" goto :EOF
echo>>"%ScriptFile%" select vdisk file="%DiskLetter%:\W-Drive.vhd"
echo>>"%ScriptFile%" detail vdisk
echo>>"%ScriptFile%" detach vdisk noerr
goto :EOF

:online
echo>"%~dpn0.txt" rem Prepare diskpart script to online the disk related to %DiskLetter%.
set ExtroCmd=onlineExtro
goto :diskpart

:onlineExtro
echo>>"%ScriptFile%" select vdisk file="%DiskLetter%:\W-Drive.vhd"
echo>>"%ScriptFile%" attach vdisk
echo>>"%ScriptFile%" detail vdisk
goto :EOF

:diskpart
if defined IntroCmd call :%IntroCmd%
echo>>"%ScriptFile%" list disk
echo>>"%ScriptFile%" select disk=%DiskPath%
echo>>"%~dpn0.txt" %ScriptCmd% disk
if defined ExtroCmd call :%ExtroCmd%
echo>>"%~dpn0.txt" exit
diskpart.exe /s "%~dpn0.txt"
if %CmdLineNoArgs% == 0 pause
