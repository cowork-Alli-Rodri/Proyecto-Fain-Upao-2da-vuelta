"""
composite_og.py — Composites the real product PNG onto the OG banner background.

Usage:
  py composite_og.py <base_banner.jpg> <product.png> <output.jpg>
"""

import sys
import os
from PIL import Image, ImageFilter, ImageDraw
import math


def radial_glow(size: tuple[int, int], color: tuple[int, int, int], radius: int) -> Image.Image:
    """Creates a soft radial glow as an RGBA image."""
    w, h = size
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    cx, cy = w // 2, h // 2
    steps = 80
    for i in range(steps, 0, -1):
        r_i = int(radius * i / steps)
        alpha = int(180 * (1 - i / steps) ** 1.6)
        bbox = [cx - r_i, cy - r_i, cx + r_i, cy + r_i]
        draw.ellipse(bbox, fill=(*color, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=radius // 8))
    return glow


def drop_shadow(img: Image.Image, offset: tuple[int, int], blur: int, opacity: int) -> Image.Image:
    """Returns an RGBA shadow layer the same size as img."""
    shadow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    if img.mode != "RGBA":
        return shadow_layer
    alpha = img.split()[3]
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    shadow.paste((0, 0, 0, opacity), mask=alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=blur))
    shadow_layer.paste(shadow, offset, mask=shadow.split()[3])
    return shadow_layer


def run():
    if len(sys.argv) < 4:
        print("Usage: py composite_og.py <base_banner.jpg> <product.png> <output.jpg>")
        sys.exit(1)

    base_path    = sys.argv[1]
    product_path = sys.argv[2]
    output_path  = sys.argv[3]

    base    = Image.open(base_path).convert("RGBA")
    product = Image.open(product_path).convert("RGBA")

    bw, bh = base.size   # 2752 × 1536
    pw, ph = product.size

    # ── Scale can to 84% of banner height ───────────────────────────
    can_h = int(bh * 0.84)
    can_w = int(can_h * pw / ph)
    can = product.resize((can_w, can_h), Image.LANCZOS)

    # ── Rotate slightly for depth ────────────────────────────────────
    can = can.rotate(-8, expand=True, resample=Image.BICUBIC)

    # ── Target center: 66% across, vertically centered ──────────────
    cx = int(bw * 0.615)
    cy = int(bh * 0.50)
    paste_x = cx - can.width  // 2
    paste_y = cy - can.height // 2

    # ── Orange radial glow behind the can ───────────────────────────
    glow_size = (int(can.width * 1.6), int(can.height * 1.1))
    glow = radial_glow(glow_size, (234, 123, 11), min(glow_size) // 2)
    glow_x = cx - glow_size[0] // 2
    glow_y = cy - glow_size[1] // 2
    base.paste(glow, (glow_x, glow_y), mask=glow.split()[3])

    # ── Drop shadow under the can ────────────────────────────────────
    shadow = drop_shadow(can, offset=(40, 60), blur=55, opacity=160)
    base.paste(shadow, (paste_x, paste_y), mask=shadow.split()[3])

    # ── Paste real can ───────────────────────────────────────────────
    base.paste(can, (paste_x, paste_y), mask=can.split()[3])

    # ── Save ─────────────────────────────────────────────────────────
    out = base.convert("RGB")
    out.save(output_path, "JPEG", quality=92, optimize=True)
    print(f"Saved: {output_path}  ({out.size[0]}×{out.size[1]})")


if __name__ == "__main__":
    run()
