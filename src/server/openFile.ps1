param(
    [bool] $multiselect
)

Add-Type -AssemblyName System.windows.forms | Out-Null;
$f = New-Object System.Windows.Forms.OpenFileDialog;
$f.Filter = 'Media Files (*.jpg, *.jpeg, *.png, *.mp4, *.gif)|*.jpg;*.jpeg;*.png;*.mp4;*.gif|All files (*.*)|*.*';
$f.AutoUpgradeEnabled = $true;
$f.Multiselect = $multiselect;
$f.ShowDialog() | Out-Null;
$f.FileNames