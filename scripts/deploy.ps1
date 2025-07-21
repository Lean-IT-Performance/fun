#!/usr/bin/env pwsh
# Wrapper de d\xE9ploiement pour Windows
param(
    [string]$Site = "all"
)

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js n'est pas install\xE9. Veuillez l'installer d'abord.";
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
node "$scriptDir/deploy-simple.js" $Site

