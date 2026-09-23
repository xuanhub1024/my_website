"""把去背笔刷素材转成开场动画用的笔刷印章。

输出为纯白 RGB + 原 alpha 的 PNG：mask 只用到 alpha 通道，白色便于预览。
笔触主轴会被旋正到水平，运行时再按落笔方向整体旋转即可。

用法：python scripts/build-brush-stamps.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent.parent
source_dir = root / "assets" / "brush-sources"
output_dir = root / "output" / "assets" / "ai-opening" / "act-01"
long_side = 512

stamps = [
    ("brush-broad.png", "09-brush-broad.png"),
    ("brush-flat.png", "10-brush-flat.png"),
    ("brush-dry.png", "11-brush-dry.png"),
]


def principal_angle(alpha):
    ys, xs = np.nonzero(alpha > 8)
    weights = alpha[ys, xs].astype(np.float64)
    points = np.stack([xs - np.average(xs, weights=weights), ys - np.average(ys, weights=weights)])
    covariance = (points * weights) @ points.T / weights.sum()
    values, vectors = np.linalg.eigh(covariance)
    axis = vectors[:, np.argmax(values)]
    return np.degrees(np.arctan2(axis[1], axis[0]))


def build(alpha):
    angle = principal_angle(alpha)
    rotated = Image.fromarray(alpha).rotate(angle, resample=Image.BICUBIC, expand=True, fillcolor=0)
    data = np.array(rotated)
    ys, xs = np.nonzero(data > 8)
    data = data[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

    stamp = Image.fromarray(data)
    scale = long_side / max(stamp.size)
    if scale < 1:
        stamp = stamp.resize((round(stamp.width * scale), round(stamp.height * scale)), Image.LANCZOS)

    canvas = Image.new("RGBA", stamp.size, (255, 255, 255, 0))
    canvas.putalpha(stamp)
    return canvas, angle


output_dir.mkdir(parents=True, exist_ok=True)
for source_name, output_name in stamps:
    alpha = np.array(Image.open(source_dir / source_name).convert("RGBA"))[..., 3]
    stamp, angle = build(alpha)
    stamp.save(output_dir / output_name, optimize=True)
    print(f"{output_name}  {stamp.width}x{stamp.height}  aspect={stamp.width / stamp.height:.2f}  rotated={angle:.1f}deg")
