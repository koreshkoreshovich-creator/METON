from pathlib import Path
from tempfile import NamedTemporaryFile

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
MIN_SIZE = 200 * 1024
MAX_WIDTH = 1600


def main():
    saved = 0
    changed = 0
    for source in sorted(ASSETS.glob("*.webp")):
        before = source.stat().st_size
        if before < MIN_SIZE:
            continue

        with Image.open(source) as image:
            image.load()
            if image.width > MAX_WIDTH:
                height = round(image.height * MAX_WIDTH / image.width)
                image = image.resize((MAX_WIDTH, height), Image.Resampling.LANCZOS)

            with NamedTemporaryFile(suffix=".webp", delete=False) as temp:
                temp_path = Path(temp.name)
            try:
                image.save(temp_path, "WEBP", quality=76, method=6, exact=True)
                after = temp_path.stat().st_size
                if after < before * 0.94:
                    source.write_bytes(temp_path.read_bytes())
                    saved += before - after
                    changed += 1
                    print(f"{source.name}: {before // 1024} KB -> {after // 1024} KB")
            finally:
                temp_path.unlink(missing_ok=True)

    print(f"Optimized {changed} heavy WebP files; saved {saved / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
