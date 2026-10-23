<#
.SYNOPSIS
    Builds the dashboard and publishes the API (with the dashboard inside it) to
    out\api, ready to upload to MonsterASP. Steps: docs\DEPLOY.md.

.PARAMETER WithUploads
    Also copies the local pictures (api\src\Codlek.Api\wwwroot\uploads). Only for
    the first upload: after that the server's pictures are the real ones.

.PARAMETER Zip
    Also makes out\codlek-api.zip, for uploading through the File Manager.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\publish-api.ps1 -WithUploads -Zip
#>
param([switch]$WithUploads, [switch]$Zip)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'out\api'

# Node and the .NET SDK are not always on PATH.
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { $env:Path = "C:\Program Files\nodejs;$env:Path" }
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) { $env:Path = "C:\Program Files\dotnet;$env:Path" }
# Low-memory machines: a smaller young generation keeps the Vite build from running out.
if (-not $env:NODE_OPTIONS) { $env:NODE_OPTIONS = '--max-semi-space-size=2' }

Write-Host '1/3 Building the dashboard (admin)...'
Push-Location (Join-Path $root 'admin')
try {
    if (-not (Test-Path node_modules)) {
        npm ci
        if ($LASTEXITCODE) { throw 'npm ci failed' }
    }
    npm run build
    if ($LASTEXITCODE) { throw 'The dashboard build failed' }
}
finally {
    Pop-Location
}

Write-Host '2/3 Publishing the API...'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
dotnet publish (Join-Path $root 'api\src\Codlek.Api\Codlek.Api.csproj') -c Release -o $out --nologo
if ($LASTEXITCODE) { throw 'dotnet publish failed' }

if (-not (Test-Path (Join-Path $out 'wwwroot\admin\index.html'))) { throw 'The dashboard is missing from the publish folder' }

if ($WithUploads) {
    Copy-Item (Join-Path $root 'api\src\Codlek.Api\wwwroot\uploads') (Join-Path $out 'wwwroot\uploads') -Recurse
}

if ($Zip) {
    $zipPath = Join-Path $root 'out\codlek-api.zip'
    if (Test-Path $zipPath) { Remove-Item $zipPath }
    Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zipPath
    Write-Host "Zip: $zipPath"
}

Write-Host "3/3 Done: $out"
