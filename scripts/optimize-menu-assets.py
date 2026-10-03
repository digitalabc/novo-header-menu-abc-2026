"""Export lightweight menu images; keep all source artwork untouched."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
destination = root / "assets" / "optimized"
destination.mkdir(exist_ok=True)
total_source = total_export = 0
sources = list((root / 'assets').glob('*.png')) + list((root / 'assets' / 'categories').glob('*.png')) + list((root / 'assets' / 'categories').glob('*.jpg'))
for source in sources:
    limit = 480 if source.stem.startswith("banner-") else 160
    folder = destination / 'categories' if source.parent.name == 'categories' else destination
    folder.mkdir(exist_ok=True)
    with Image.open(source) as picture:
        picture.thumbnail((limit, limit), Image.Resampling.LANCZOS)
        target = folder / (source.stem + ".webp")
        for quality in (84, 78, 72, 66, 60, 52):
            picture.save(target, "WEBP", quality=quality, method=4)
            if limit == 480 or target.stat().st_size < 15000: break
        if limit != 480:
            assert target.stat().st_size < 15000, f'Icon exceeds 15 KB: {target}'
    total_source += source.stat().st_size
    total_export += target.stat().st_size
print(f"Raster sources: {total_source:,} bytes; WebP exports: {total_export:,} bytes. Every icon < 15,000 bytes.")
