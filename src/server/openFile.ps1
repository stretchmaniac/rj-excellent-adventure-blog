param(
    [bool] $multiselect
)

Unblock-File -Path .\src\server\file-dialog-in-selected-order.dll
Add-Type -Path .\src\server\file-dialog-in-selected-order.dll
$f = New-Object file_dialog_in_selected_order.MainForm -ArgumentList $multiselect