from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"


def main():
    converted = 0
    before = 0
    after = 0
    for source in sorted(ASSETS.glob("*.png")):
        target = source.with_suffix(".webp")
        before += source.stat().st_size
        with Image.open(source) as image:
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")
            image.save(target, "WEBP", quality=88, method=6, exact=True)
        after += target.stat().st_size
        converted += 1
    print(f"Converted {converted} PNG files: {before / 1024 / 1024:.1f} MB -> {after / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
