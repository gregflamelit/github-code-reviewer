$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$reviewerNode = Get-Command node -ErrorAction SilentlyContinue
if (-not $reviewerNode) {
    $reviewerBundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (Test-Path -LiteralPath $reviewerBundledNode) { $reviewerNode = Get-Item -LiteralPath $reviewerBundledNode }
}
if (-not $reviewerNode) { throw 'Node.js 24 or later is required. Install it and rerun this script.' }
$reviewerCodex = Get-Command codex -ErrorAction SilentlyContinue
if (-not $reviewerCodex -and -not $env:CODEX_BIN) {
    $reviewerCodexRoot = Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\bin'
    if (Test-Path -LiteralPath $reviewerCodexRoot) {
        $reviewerCandidate = Get-ChildItem -LiteralPath $reviewerCodexRoot -Filter codex.exe -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($reviewerCandidate) { $env:CODEX_BIN = $reviewerCandidate.FullName }
    }
}
$reviewerNodePath = if ($reviewerNode.Source) { $reviewerNode.Source } else { $reviewerNode.FullName }
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/pdfkit'))) { throw 'Install app dependencies first: run npm install (or pnpm install), then rerun start.ps1.' }
& $reviewerNodePath (Join-Path $PSScriptRoot 'server.mjs')
