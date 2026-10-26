# Agente diario de Instagram: lo lanza el Programador de tareas de Windows (L-V 13:00).
# Solo trabaja si ese día el plan está aprobado en Telegram («✅ Adelante»); si no, termina en segundos.
$ErrorActionPreference = 'Continue'
$OutputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$log = Join-Path $PSScriptRoot ("logs\" + (Get-Date -Format 'yyyy-MM-dd') + '.log')
New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot 'logs') | Out-Null

$plan = node n8n/ig-plan.mjs hoy | Out-String
if ($plan -match 'nada_que_hacer') { "$(Get-Date -Format s) nada aprobado hoy" | Out-File -Append $log; exit 0 }

$prompt = "Eres el agente diario de Instagram de Transforma con IA. Sigue al pie de la letra agente-ig/INSTRUCCIONES.md (léelo primero). Plan aprobado de hoy:`n$plan"
$tools = 'Read,ToolSearch,Bash(node n8n/ig-plan.mjs:*),mcp__plugin_ecc_chrome-devtools'
& "$env:USERPROFILE\.local\bin\claude.exe" -p $prompt --allowedTools $tools --max-turns 200 *>&1 | Out-File -Append -Encoding utf8 $log

# si el agente no ha llegado a cerrar el día, que al menos llegue el aviso
$fin = node n8n/ig-plan.mjs hoy | Out-String
if ($fin -notmatch '"hecho"' -and $fin -notmatch 'nada_que_hacer') {
  "El agente de Instagram no ha terminado hoy. Mira agente-ig/logs/$(Get-Date -Format 'yyyy-MM-dd').log o pídemelo en Claude Code." | node n8n/ig-plan.mjs hecho
}
