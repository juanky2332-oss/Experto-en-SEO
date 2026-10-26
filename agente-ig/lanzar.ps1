# Agente diario de Instagram: lo lanza el Programador de tareas de Windows (L-V 13:00, o al encender el PC si estaba apagado,
# y otra vez a las 17:00 por si a mediodía no pudo). Hace lo que queda pendiente de la lista del día (seguir y comentar);
# si no hay nada pendiente, termina en segundos. Lo que no haga, a las 19:00 se le manda a Telegram como lista para el móvil.
# Nunca corren dos a la vez (candado) y a las 18:45 se corta, para no pisarse con la lista del móvil.
$ErrorActionPreference = 'Continue'
$OutputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$log = Join-Path $PSScriptRoot ("logs\" + (Get-Date -Format 'yyyy-MM-dd') + '.log')
New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot 'logs') | Out-Null

$candado = New-Object System.Threading.Mutex($false, 'Global\TransformaConIA-Instagram')
if (-not $candado.WaitOne(0)) { "$(Get-Date -Format s) ya hay otro en marcha" | Out-File -Append $log; exit 0 }
try {
  $corte = (Get-Date).Date.AddHours(18).AddMinutes(45)
  if ((Get-Date) -ge $corte) { "$(Get-Date -Format s) fuera de hora" | Out-File -Append $log; exit 0 }
  $hoy = node n8n/ig-plan.mjs hoy | Out-String
  if ($hoy -match 'nada_que_hacer') { "$(Get-Date -Format s) nada pendiente" | Out-File -Append $log; exit 0 }

  $prompt = "Eres el agente diario de Instagram de Transforma con IA. Sigue al pie de la letra agente-ig/INSTRUCCIONES.md (léelo primero). Tareas pendientes de hoy:`n$hoy"
  $tools = 'Read,ToolSearch,Bash(node n8n/ig-plan.mjs:*),mcp__plugin_ecc_chrome-devtools'
  $salida = Join-Path $PSScriptRoot ("logs\" + (Get-Date -Format 'yyyy-MM-dd_HHmm') + '-claude.log')
  $p = Start-Process -FilePath "$env:USERPROFILE\.local\bin\claude.exe" -NoNewWindow -PassThru `
    -ArgumentList @('-p', ('"' + $prompt.Replace('"', '\"') + '"'), '--allowedTools', $tools, '--max-turns', '200') `
    -RedirectStandardOutput $salida -RedirectStandardError ($salida + '.err')
  $segundos = [int]($corte - (Get-Date)).TotalSeconds
  if (-not $p.WaitForExit($segundos * 1000)) {
    Stop-Process -Id $p.Id -Force
    "$(Get-Date -Format s) cortado a las 18:45" | Out-File -Append $log
    node n8n/ig-plan.mjs hecho "Me he quedado sin tiempo en el ordenador; lo que falte te llega a las 19:00 en la lista del móvil." | Out-Null
  }
  "$(Get-Date -Format s) terminado (código $($p.ExitCode))" | Out-File -Append $log
} finally {
  $candado.ReleaseMutex()
}
