$cssPath = "d:\mysa\abcdaconstrucao\Assets\CSS\landing-pages\semana-do-cliente\semana_do_cliente.css"
$content = Get-Content -Path $cssPath -Raw

# Substituir repetidamente para cobrir casos onde há mais de uma regra junta
for ($i = 0; $i -lt 5; $i++) {
    $content = $content -replace "(?s)[^}]*\.spot[^{]*\{[^}]*\}", ""
    $content = $content -replace "(?s)[^}]*\.cronometro--spot[^{]*\{[^}]*\}", ""
}

Set-Content -Path $cssPath -Value $content -Encoding UTF8
