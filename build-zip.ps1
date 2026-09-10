$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$zipFile = Join-Path $source "web\poems.zip"
$imgRoot = Join-Path $source "web\img"
$staging = Join-Path $env:TEMP "poems-zip-staging"

if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
if (Test-Path $imgRoot) { Remove-Item $imgRoot -Recurse -Force }
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null
New-Item -ItemType Directory -Path $imgRoot | Out-Null

$yearDirs = Get-ChildItem $source -Directory | Where-Object { $_.Name -ne 'web' -and $_.Name -ne '.git' }

foreach ($dir in $yearDirs) {
  $imgDir = Join-Path $dir.FullName 'images'
  if (Test-Path $imgDir) {
    $destImg = Join-Path $imgRoot $dir.Name
    New-Item -ItemType Directory -Path $destImg | Out-Null
    Copy-Item (Join-Path $imgDir '*') -Destination $destImg -Recurse -Force
  }

  $destDir = Join-Path $staging $dir.Name
  New-Item -ItemType Directory -Path $destDir | Out-Null
  Get-ChildItem $dir.FullName | Where-Object { $_.Name -ne 'images' } | Copy-Item -Destination $destDir -Recurse -Force
}

Get-ChildItem $source -File | Where-Object { $_.Name -ne 'build-zip.ps1' } | Copy-Item -Destination $staging -Force

Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zipFile -CompressionLevel Optimal

Remove-Item $staging -Recurse -Force

Write-Host "打包完成: $zipFile"
Write-Host "图片目录: $imgRoot"
