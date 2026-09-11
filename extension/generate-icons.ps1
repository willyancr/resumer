Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "icons"
if (!(Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

function Create-Icon([int]$size, [string]$name) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 147, 51, 234), # Purple
        [System.Drawing.Color]::FromArgb(255, 79, 70, 229),   # Indigo
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )

    $radius = [int]($size * 0.22)
    if ($radius -lt 2) { $radius = 2 }
    $diameter = $radius * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $diameter, $diameter, 180, 90)
    $path.AddArc(($size - $diameter), 0, $diameter, $diameter, 270, 90)
    $path.AddArc(($size - $diameter), ($size - $diameter), $diameter, $diameter, 0, 90)
    $path.AddArc(0, ($size - $diameter), $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    $g.FillPath($brush, $path)

    $fontFamily = New-Object System.Drawing.FontFamily "Segoe UI"
    $fontSize = [float]($size * 0.6)
    if ($fontSize -lt 8) { $fontSize = 8 }
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textRect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
    $g.DrawString("R", $font, [System.Drawing.Brushes]::White, $textRect, $sf)

    $dest = Join-Path $iconsDir $name
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $dest"
}

Create-Icon 16 "icon16.png"
Create-Icon 48 "icon48.png"
Create-Icon 128 "icon128.png"
