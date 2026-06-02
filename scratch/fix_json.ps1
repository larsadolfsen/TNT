$path = "c:\Users\LAAD\.gemini\antigravity\scratch\TNT\templates\product.dug.json"
$c = Get-Content $path -Raw
$new = $c.Replace("padding_horizontal", "padding_sides")
Set-Content $path -Value $new -NoNewline
Write-Host "Replaced padding_horizontal in product.dug.json!"
