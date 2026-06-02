$blocksDir = "c:\Users\LAAD\.gemini\antigravity\scratch\TNT\blocks"
$sectionsDir = "c:\Users\LAAD\.gemini\antigravity\scratch\TNT\sections"

function Analyze-Directory($dir) {
    Write-Host "Analyzing directory: $dir"
    Get-ChildItem -Path $dir -Filter *.liquid | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        if ($content -match '\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}') {
            $schemaStr = $Matches[1].Trim()
            try {
                $schema = $schemaStr | ConvertFrom-Json
                $paddingSettings = @()
                if ($schema.settings) {
                    foreach ($setting in $schema.settings) {
                        $id = $setting.id
                        $label = $setting.label
                        $hasPadding = $false
                        if ($id -and ($id.ToLower().Contains("padding") -or $id.ToLower().Contains("afstand"))) {
                            $hasPadding = $true
                        }
                        if ($label -and ($label.ToLower().Contains("padding") -or $label.ToLower().Contains("afstand"))) {
                            $hasPadding = $true
                        }
                        if ($hasPadding) {
                            $paddingSettings += $setting
                        }
                    }
                }
                if ($paddingSettings.Count -gt 0) {
                    Write-Host "`nFile: $($_.Name)"
                    foreach ($p in $paddingSettings) {
                        Write-Host "  ID: $($p.id), Type: $($p.type), Label: $($p.label), Default: $($p.default), Min: $($p.min), Max: $($p.max), Step: $($p.step)"
                    }
                }
            } catch {
                Write-Host "Error parsing schema in $($_.Name): $_"
            }
        }
    }
}

Write-Host "--- BLOCKS ---"
Analyze-Directory $blocksDir
Write-Host "`n--- SECTIONS ---"
Analyze-Directory $sectionsDir
