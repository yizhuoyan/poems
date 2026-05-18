$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$zipFile = Join-Path $source "web\poems.zip"

if (Test-Path $zipFile) { Remove-Item $zipFile -Force }

$targets = Get-ChildItem $source -Directory | Where-Object { $_.Name -ne 'web' -and $_.Name -ne '.git' } | Select-Object -ExpandProperty FullName

$targets += @(Get-ChildItem $source -File | Where-Object { $_.Name -ne 'build-zip.ps1' } | Select-Object -ExpandProperty FullName)

Compress-Archive -Path $targets -DestinationPath $zipFile -CompressionLevel Optimal

Write-Host "打包完成: $zipFile"
