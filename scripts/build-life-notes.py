"""把去背的手写批注裁到墨迹边界，并按“单字大小一致”统一缩放。

字号用每行的平均字符步进宽度衡量（中文近似等宽），比行高更稳定。
输出为网页展示尺寸的 2 倍，供 retina 屏使用。

用法：python scripts/build-life-notes.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent.parent
source_dir = Path.home() / ".cursor" / "projects" / "Users-xuan-Documents-AABBC2-2026-my-website" / "assets"
output_dir = root / "assets" / "life" / "notes"
target_advance = 20
pixel_ratio = 2

# 每张图各行的字符数，用来换算单字步进宽度
notes = [
    ("family-cat-rescue.png", "1.handwriting-1786094662793-removebg-preview-af9998ee-7fe7-4d56-8051-4bec07520333.png", [14, 9, 9]),
    ("family-cat-fur.png", "2.___2026-08-07___5.28.54-removebg-preview-ce6a9d5b-f7f3-40eb-90f2-6ba375aa2955.png", [9, 7]),
    ("family-rats.png", "3.____2026-08-07___5.35.07-removebg-preview-052bada6-8653-494f-943b-9017d7a7f911.png", [13, 18, 17]),
]


def text_lines(ink):
    rows = ink.any(axis=1)
    bands, start = [], None
    for y, on in enumerate(rows):
        if on and start is None:
            start = y
        elif not on and start is not None:
            bands.append((start, y))
            start = None
    if start is not None:
        bands.append((start, len(rows)))
    return [band for band in bands if band[1] - band[0] > 5]


def char_advance(ink, counts):
    widths = []
    for (top, bottom), count in zip(text_lines(ink), counts):
        xs = np.nonzero(ink[top:bottom].any(axis=0))[0]
        widths.append((xs.max() - xs.min() + 1) / count)
    return float(np.median(widths))


output_dir.mkdir(parents=True, exist_ok=True)
for output_name, source_name, counts in notes:
    image = Image.open(source_dir / source_name).convert("RGBA")
    ink = np.array(image)[..., 3] > 40
    ys, xs = np.nonzero(ink)
    image = image.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

    scale = target_advance * pixel_ratio / char_advance(np.array(image)[..., 3] > 40, counts)
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    image.save(output_dir / output_name, optimize=True)
    print(f"{output_name}  {image.width}x{image.height}  css={image.width // pixel_ratio}px")
