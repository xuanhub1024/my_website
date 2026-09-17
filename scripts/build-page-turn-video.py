"""把 16:9 翻页动画转成网页用的静音 H.264。

关键帧间隔压到 6 帧，方便前端跟随拖动直接 seek currentTime 逐帧擦洗。

依赖：pip install imageio-ffmpeg
用法：python scripts/build-page-turn-video.py
"""

import subprocess
from pathlib import Path

import imageio_ffmpeg

root = Path(__file__).resolve().parent.parent
source = Path.home() / "Downloads" / "5.1翻页动画.mov"
output = root / "output" / "assets" / "ai-opening" / "act-01" / "12-page-turn.mp4"
keyframe_interval = 6

output.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(
    [
        imageio_ffmpeg.get_ffmpeg_exe(),
        "-hide_banner", "-v", "error", "-y",
        "-i", str(source),
        "-an",
        "-vf", "scale=1280:720:flags=lanczos,fps=30",
        "-c:v", "libx264",
        "-profile:v", "high",
        "-pix_fmt", "yuv420p",
        "-crf", "26",
        "-preset", "slow",
        "-g", str(keyframe_interval),
        "-keyint_min", str(keyframe_interval),
        "-sc_threshold", "0",
        "-movflags", "+faststart",
        str(output),
    ],
    check=True,
)
print(f"{output.relative_to(root)}  {output.stat().st_size / 1024 / 1024:.2f}MB")
