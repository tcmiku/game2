"""Append reference-inspired swords to the existing hand-drawn pixel atlas."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]


def sword(dark=False):
    im = Image.new('RGBA', (64, 64))
    d = ImageDraw.Draw(im)
    ink = '#0a131e'
    edge = '#d1d9eb' if dark else '#b9fff0'
    body = '#161c2a' if dark else '#74d4c5'
    shade = '#525d75' if dark else '#338e94'
    # Tip points up. Dark blade has a silver rim and asymmetric hooked guard;
    # green blade has a long inset fuller and angular, crystalline quillons.
    d.polygon([(32, 2), (37, 12), (37, 41), (33, 46), (28, 41), (28, 12)], fill=ink)
    d.polygon([(32, 3), (36, 13), (36, 40), (32, 44), (29, 40), (29, 13)], fill=edge)
    d.polygon([(32, 7), (34, 14), (34, 39), (32, 42), (30, 39), (30, 14)], fill=body)
    d.line([(32, 12), (32, 38)], fill=shade, width=1)
    if dark:
        points = [(18, 39), (24, 36), (28, 39), (31, 42), (36, 39), (41, 38), (46, 42), (42, 43), (43, 49), (37, 47), (35, 50), (32, 47), (29, 49), (26, 44), (21, 44)]
        d.polygon(points, fill=ink, outline=edge)
        d.line([(24, 39), (28, 43), (31, 43), (33, 48)], fill=shade)
        d.rectangle((30, 45, 34, 58), fill=ink, outline=shade)
        for y in [48, 51, 54]:
            d.line([(31, y), (33, y+1)], fill='#303a50')
        d.rectangle((29, 58, 35, 61), fill=shade, outline=edge)
    else:
        d.polygon([(15, 35), (24, 38), (29, 42), (35, 41), (43, 36), (48, 34), (45, 44), (37, 46), (32, 49), (26, 45), (19, 44)], fill=shade, outline=edge)
        d.line([(19, 38), (27, 42), (31, 45), (36, 44), (44, 38)], fill=body, width=2)
        d.rectangle((30, 48, 34, 59), fill='#173e40', outline=shade)
        d.line([(32, 50), (32, 57)], fill='#c1f2df')
        d.rectangle((29, 59, 35, 62), fill='#224c50', outline=body)
    d.polygon([(32, 41), (35, 44), (32, 47), (29, 44)], fill=body, outline=edge)
    return im


def generate():
    out = ROOT / 'public/art'
    old = Image.open(out / 'pixel-weapons.png').convert('RGBA')
    atlas = Image.new('RGBA', (384, 640))
    atlas.paste(old, (0, 0))
    black, green = sword(True), sword(False)
    relic = Image.new('RGBA', (64, 64))
    d = ImageDraw.Draw(relic)
    d.ellipse((3, 3, 60, 60), fill='#102533', outline='#81cec9', width=2)
    for im, angle, x in [(black, -31, 3), (green, 31, 4)]:
        rotated = im.resize((52, 52), Image.Resampling.NEAREST).rotate(angle, resample=Image.Resampling.NEAREST)
        relic.alpha_composite(rotated, (x, 5))
    d = ImageDraw.Draw(relic)
    d.polygon([(32, 24), (34, 29), (40, 31), (34, 33), (32, 39), (30, 33), (25, 31), (30, 29)], fill='#ecfff5')
    for index, icon in [(68, black), (69, green), (70, relic)]:
        i = index - 16
        atlas.paste(icon, (i % 6 * 64, i // 6 * 64))
    assert atlas.crop((0, 0, 384, 512)).tobytes() == old.crop((0, 0, 384, 512)).tobytes()
    assert atlas.crop((0, 512, 256, 576)).tobytes() == old.crop((0, 512, 256, 576)).tobytes()
    atlas.save(out / 'pixel-weapons.png', optimize=True)
    atlas.resize((768, 1280), Image.Resampling.NEAREST).save(out / 'pixel-weapons-preview.png')
    preview = Image.new('RGB', (576, 192), '#101e2c')
    for i, icon in enumerate([black, green, relic]):
        icon = icon.resize((192, 192), Image.Resampling.NEAREST)
        preview.paste(icon, (i*192, 0), icon)
    preview.save(out / 'pixel-dual-swords-preview.png')


if __name__ == '__main__':
    generate()
