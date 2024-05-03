Add-Type -AssemblyName System.windows.forms | Out-Null;
$f = New-Object System.Windows.Forms.FolderBrowserDialog;
$f.ShowDialog() | Out-Null;
$f.SelectedPath