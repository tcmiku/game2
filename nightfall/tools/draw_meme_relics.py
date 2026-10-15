"""Extend the existing pixel atlas with four relics, preserving every old cell."""
from pathlib import Path
from PIL import Image, ImageDraw
from draw_meme_art import creature

ROOT = Path(__file__).resolve().parents[1]
COLORS = ['#bce1cf', '#b1e1f0', '#dfc5f1', '#f0d58b']
KINDS = ['spincat', 'gugu', 'manbo', 'bananacat']


def relic(kind, color):
    im = Image.new('RGBA', (64, 64))
    d = ImageDraw.Draw(im)
    ink, pale = '#132331', '#f4edda'
    d.ellipse((5, 5, 58, 58), fill=ink, outline=color, width=2)
    d.arc((10, 10, 53, 53), 15, 160, fill=pale, width=2)
    d.arc((10, 10, 53, 53), 195, 340, fill=color, width=2)
    base = creature(kind).resize((44, 44), Image.Resampling.NEAREST)
    im.alpha_composite(base, (10, 10))
    d = ImageDraw.Draw(im)
    if kind == 'spincat':
        for x, y in [(10, 15), (48, 9), (49, 45)]:
            d.polygon([(x, y-5), (x+2, y-1), (x+6, y), (x+2, y+2), (x, y+6), (x-2, y+2), (x-5, y)], fill=color)
    elif kind == 'gugu':
        d.polygon([(20, 14), (19, 6), (26, 10), (32, 3), (38, 10), (45, 6), (43, 14)], fill=ink, outline=color)
        d.line([(8, 41), (13, 30), (17, 42)], fill='#d6bff0', width=2)
        d.line([(48, 40), (53, 28), (57, 41)], fill=color, width=2)
    elif kind == 'manbo':
        d.polygon([(18, 28), (8, 37), (9, 49), (28, 39)], fill='#a49ac9', outline=color)
        for x in [10, 18, 26]:
            d.line([(x, 54), (x+18, 54)], fill=color, width=2)
    else:
        d.ellipse((8, 46, 56, 58), fill=ink, outline=color, width=2)
        d.line([(13, 51), (51, 51)], fill=pale, width=2)
        d.polygon([(24, 12), (24, 4), (30, 8), (36, 3), (40, 11)], fill=color)
    return im


def generate():
    out = ROOT / 'public/art'
    old = Image.open(out / 'pixel-weapons.png').convert('RGBA')
    assert old.width == 384 and old.height >= 512
    atlas = Image.new('RGBA', (384, max(576, old.height)))
    atlas.paste(old, (0, 0))
    preview = Image.new('RGB', (768, 192), '#14212c')
    for i, kind in enumerate(KINDS):
        icon = relic(kind, COLORS[i])
        atlas.paste(icon, (i * 64, 512))
        large = icon.resize((192, 192), Image.Resampling.NEAREST)
        preview.paste(large, (i * 192, 0), large)
    assert atlas.crop((0, 0, 384, 512)).tobytes() == old.crop((0, 0, 384, 512)).tobytes()
    atlas.save(out / 'pixel-weapons.png', optimize=True)
    atlas.resize((768, atlas.height * 2), Image.Resampling.NEAREST).save(out / 'pixel-weapons-preview.png')
    preview.save(out / 'pixel-meme-relics-preview.png')


if __name__ == '__main__':
    generate()
