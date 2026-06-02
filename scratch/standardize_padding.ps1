$files = @(
    "page-title.liquid",
    "product-accordions.liquid",
    "product-banner-text.liquid",
    "product-buy-buttons.liquid",
    "product-cross-sell.liquid",
    "product-customizer.liquid",
    "product-materials.liquid",
    "product-media.liquid",
    "product-price.liquid",
    "product-shipping-progress.liquid",
    "product-testimonial.liquid",
    "product-trust-checkmarks.liquid",
    "product-trust.liquid",
    "product-urgency.liquid",
    "text.liquid"
)

$blocksDir = "c:\Users\LAAD\.gemini\antigravity\scratch\TNT\blocks"

foreach ($file in $files) {
    $path = Join-Path $blocksDir $file
    Write-Host "Processing $file..."
    
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        
        # 1. Replace padding_horizontal references in template style block
        $newContent = $content -replace 'block\.settings\.padding_horizontal', 'block.settings.padding_sides'
        
        # 2. Replace "id": "padding_horizontal" in schema
        $newContent = $newContent -replace '"id":\s*"padding_horizontal"', '"id": "padding_sides"'
        
        # 3. Replace "label": "Sideafstand" in schema
        $newContent = $newContent -replace '"label":\s*"Sideafstand"', '"label": "Afstand i siderne"'
        
        # Save content
        Set-Content -Path $path -Value $newContent -NoNewline
        Write-Host "  Standardized!"
    } else {
        Write-Error "  File not found: $path"
    }
}
