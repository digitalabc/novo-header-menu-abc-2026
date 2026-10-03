"""Export lightweight menu images; keep all source artwork untouched."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
destination = root / "assets" / "optimized"
destination.mkdir(exist_ok=True)
total_source = total_export = 0
for source in (root / "assets").glob("*.png"):
    limit = 480 if source.stem.startswith("banner-") else 160
    with Image.open(source) as picture:
        picture.thumbnail((limit, limit), Image.Resampling.LANCZOS)
        target = destination / (source.stem + ".webp")
        picture.save(target, "WEBP", quality=84, method=6)
    total_source += source.stat().st_size
    total_export += target.stat().st_size
print(f"PNG sources: {total_source:,} bytes; WebP exports: {total_export:,} bytes")
