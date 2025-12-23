# AkmePowerForm.ps1
# Run with `powershell -file test.ps1`
# This notes using an HTA-HTML UI for VBScript and JScript, and Windows.Forms for PowerShell.
# https://stackoverflow.com/questions/36035017/how-to-make-an-html-gui-for-powershell-scripts
# https://theitbros.com/powershell-gui-for-scripts/
# https://lazyadmin.nl/powershell/powershell-gui-howto-get-started/

Add-Type -AssemblyName System.Windows.Forms | Out-Null

$form = New-Object Windows.Forms.Form
$form.AutoSize = $true
$form.AutoSizeMode = 'GrowAndShrink'

$form.Text = 'Window Title'

$label = New-Object Windows.Forms.Label
$label.Text = 'some text'
$label.AutoSize = $true
$form.Controls.Add($label)

$form.ShowDialog()
