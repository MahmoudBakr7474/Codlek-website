<#
.SYNOPSIS
    Builds the dashboard and publishes the API (with the dashboard inside it) to
    out\api. With -Deploy it also uploads it to MonsterASP over WebDeploy.
    Steps: docs\DEPLOY.md.

.PARAMETER Deploy
    Uploads out\api to the site over WebDeploy: only the files whose content
    changed, with the site offline during the copy. It never touches the server's
    own files: the pictures (wwwroot\uploads), CVs and sign-in keys (storage), the
    HTTPS certificate challenge (.well-known), logs, or an appsettings.Production.json.

.PARAMETER PublishProfile
    The .publishSettings file downloaded from MonsterASP (the website -> Deploy ->
    WebDeploy). It holds the WebDeploy password: keep it outside the repository.
    Default: the one .publishSettings file in the folder that holds the repository.

.PARAMETER DryRun
    With -Deploy: lists what would change on the server and changes nothing.

.PARAMETER NoBuild
    Skips the build and uses out\api as it is.

.PARAMETER WithUploads
    Also copies the local pictures (api\src\Codlek.Api\wwwroot\uploads). Only for
    the first upload by hand: after that the server's pictures are the real ones.

.PARAMETER Zip
    Also makes out\codlek-api.zip, for uploading through the File Manager.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\publish-api.ps1 -Deploy
#>
param([switch]$Deploy, [string]$PublishProfile, [switch]$DryRun, [switch]$NoBuild, [switch]$WithUploads, [switch]$Zip)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'out\api'

if (-not $NoBuild) {
    # Node and the .NET SDK are not always on PATH.
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { $env:Path = "C:\Program Files\nodejs;$env:Path" }
    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) { $env:Path = "C:\Program Files\dotnet;$env:Path" }
    # Low-memory machines: a smaller young generation keeps the Vite build from running out.
    if (-not $env:NODE_OPTIONS) { $env:NODE_OPTIONS = '--max-semi-space-size=2' }

    Write-Host 'Building the dashboard (admin)...'
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

    Write-Host 'Publishing the API...'
    if (Test-Path $out) { Remove-Item $out -Recurse -Force }
    dotnet publish (Join-Path $root 'api\src\Codlek.Api\Codlek.Api.csproj') -c Release -o $out --nologo
    if ($LASTEXITCODE) { throw 'dotnet publish failed' }

    if ($WithUploads) {
        Copy-Item (Join-Path $root 'api\src\Codlek.Api\wwwroot\uploads') (Join-Path $out 'wwwroot\uploads') -Recurse
    }
}

if (-not (Test-Path (Join-Path $out 'wwwroot\admin\index.html'))) { throw "The dashboard is missing from $out" }

if ($Zip) {
    $zipPath = Join-Path $root 'out\codlek-api.zip'
    if (Test-Path $zipPath) { Remove-Item $zipPath }
    Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zipPath
    Write-Host "Zip: $zipPath"
}

if ($Deploy) {
    if (-not $PublishProfile) {
        $found = @(Get-ChildItem (Split-Path -Parent $root) -Filter *.publishSettings)
        if ($found.Count -ne 1) { throw 'Pass -PublishProfile <file.publishSettings> (MonsterASP: the website -> Deploy -> WebDeploy).' }
        $PublishProfile = $found[0].FullName
    }

    $msdeploy = 'C:\Program Files\IIS\Microsoft Web Deploy V3\msdeploy.exe'
    if (-not (Test-Path $msdeploy)) { throw 'Web Deploy (msdeploy.exe) is not installed.' }

    [xml]$settings = Get-Content -Raw $PublishProfile
    $target = $settings.publishData.publishProfile | Where-Object { $_.publishMethod -eq 'MSDeploy' } | Select-Object -First 1
    if (-not $target) { throw "$PublishProfile has no WebDeploy profile" }

    Write-Host "Uploading to $($target.msdeploySite)$(if ($DryRun) { ' (dry run: nothing changes)' })..."
    $arguments = @(
        '-verb:sync',
        "-source:contentPath=$out",
        "-dest:contentPath=$($target.msdeploySite),publishSettings=$PublishProfile",
        '-useChecksum',
        '-enableRule:AppOffline',
        '-allowUntrusted',
        # The server's own files.
        '-skip:objectName=dirPath,absolutePath=\\wwwroot\\uploads$',
        '-skip:objectName=dirPath,absolutePath=\\storage$',
        '-skip:objectName=dirPath,absolutePath=\\\.well-known$',
        '-skip:objectName=dirPath,absolutePath=\\logs$',
        '-skip:objectName=filePath,absolutePath=\\appsettings\.Production\.json$'
    )
    if ($DryRun) { $arguments += '-whatif' }

    & $msdeploy @arguments
    if ($LASTEXITCODE) { throw 'WebDeploy failed' }

    if (-not $DryRun) {
        $health = ($target.destinationAppUrl -replace '^http:', 'https:').TrimEnd('/') + '/api/health'
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        try {
            $response = Invoke-WebRequest $health -UseBasicParsing -TimeoutSec 90
            Write-Host "Health: $($response.StatusCode) $($response.Content)"
        }
        catch {
            Write-Warning "Health check failed ($health): $_"
        }
    }
}

Write-Host "Done: $out"
