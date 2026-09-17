"""把文书 PDF 逐页渲染成网页用的 WebP，供 doc-viewer 组件翻页阅览。

依赖：pip install pymupdf pillow
用法：python scripts/build-doc-pages.py
"""

from pathlib import Path

import pymupdf
from PIL import Image

root = Path(__file__).resolve().parent.parent
output_root = root / "output" / "assets" / "documents"
page_width = 1200
quality = 72

documents = [
    ("lilv-defense", "/Users/xuan/Documents/AABBC2/个人经历/理律/理律 - 6号赛队 被告答辩状(1).pdf"),
    ("xinshi-appeal", "/Users/xuan/Documents/AABBC2/个人经历/信实/信实C2上诉状.pdf"),
    ("thesis-defense", "/Users/xuan/Documents/AABBC2/2024/春/毕业论文/论文答辩-吴芓璇0604.pdf"),
]

for slug, source in documents:
    doc = pymupdf.open(source)
    target_dir = output_root / slug
    target_dir.mkdir(parents=True, exist_ok=True)
    total = 0
    for index, page in enumerate(doc, start=1):
        zoom = page_width / page.rect.width
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        path = target_dir / f"page-{index:02d}.webp"
        image.save(path, "WEBP", quality=quality, method=5)
        total += path.stat().st_size
    print(f"{slug}: {len(doc)} pages, {pixmap.width}x{pixmap.height}, {total / 1024 / 1024:.2f}MB")
