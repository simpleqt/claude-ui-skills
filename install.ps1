# claude-ui-skills installer (Windows PowerShell)
# Usage:
#   ./install.ps1                                   # all skills -> ~\.agents\skills
#   ./install.ps1 -Target ~\.claude\skills          # all skills -> Claude Code
#   ./install.ps1 -Skills cds-foundation,cds-chat   # subset
param(
  [string]$Target = "$env:USERPROFILE\.agents\skills",
  [string[]]$Skills = @()
)

$AllSkills = @('cds-foundation','cds-motion','cds-components','cds-chat','cds-media','cds-desktop')
if ($Skills.Count -eq 0) { $Skills = $AllSkills }

$srcRoot = Join-Path $PSScriptRoot 'skills'
New-Item -ItemType Directory -Force -Path $Target | Out-Null

foreach ($skill in $Skills) {
  $src = Join-Path $srcRoot $skill
  if (-not (Test-Path $src)) {
    Write-Error "unknown skill: $skill (available: $($AllSkills -join ', '))"
    exit 1
  }
  $dst = Join-Path $Target $skill
  if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
  Copy-Item -Recurse $src $dst
  Write-Host "installed $skill -> $dst"
}

Write-Host ""
Write-Host "done. verify by asking your agent for a 'Claude-style UI'."
