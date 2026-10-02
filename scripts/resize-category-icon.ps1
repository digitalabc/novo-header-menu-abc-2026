param(
  [Parameter(Mandatory=$true)][string]$SourcePath,
  [Parameter(Mandatory=$true)][string]$DestinationPath
)

# Mechanical export only: keep the generated image and its alpha unchanged,
# resampling a project-sized copy. No background removal or product editing.
if (Test-Path -LiteralPath $DestinationPath) { throw "Destination already exists: $DestinationPath" }
Add-Type -AssemblyName System.Drawing
$iconSource = [System.Drawing.Image]::FromFile($SourcePath)
$iconCanvas = New-Object System.Drawing.Bitmap(128, 128, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb))
$iconGraphics = [System.Drawing.Graphics]::FromImage($iconCanvas)
try {
  $iconGraphics.Clear([System.Drawing.Color]::Transparent)
  $iconGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $iconGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $iconGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $iconGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $iconRatio = [Math]::Min(128 / $iconSource.Width, 128 / $iconSource.Height)
  $iconWidth = [int][Math]::Round($iconSource.Width * $iconRatio)
  $iconHeight = [int][Math]::Round($iconSource.Height * $iconRatio)
  $iconGraphics.DrawImage($iconSource, [int]((128 - $iconWidth) / 2), [int]((128 - $iconHeight) / 2), $iconWidth, $iconHeight)
  $iconCanvas.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $iconGraphics.Dispose()
  $iconCanvas.Dispose()
  $iconSource.Dispose()
}
