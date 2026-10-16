"""Add a crowned four-meme crest without altering any other weapon sprite."""
from pathlib import Path
from PIL import Image, ImageDraw
from draw_meme_art import creature

ROOT = Path(__file__).resolve().parents[1]


def generate():
    path = ROOT / 'public/art/pixel-weapons.png'
    atlas = Image.open(path).convert('RGBA')
    before = atlas.copy()
    icon = Image.new('RGBA', (64, 64))
    d = ImageDraw.Draw(icon)
    d.ellipse((2, 2, 61, 61), fill='#112533', outline='#f1d58b', width=2)
    d.ellipse((5, 5, 58, 58), outline='#776d58')
    for kind, pos in zip(['spincat', 'gugu', 'manbo', 'bananacat'], [(6, 17), (33, 17), (6, 38), (33, 38)]):
        icon.alpha_composite(creature(kind).resize((25, 25), Image.Resampling.NEAREST), pos)
    d = ImageDraw.Draw(icon)
    d.polygon([(19, 6), (25, 10), (31, 3), (38, 10), (44, 6), (41, 18), (22, 18)], fill='#a47b38', outline='#f9e5a7')
    d.polygon([(22, 9), (26, 12), (31, 7), (36, 12), (41, 9), (39, 15), (24, 15)], fill='#efd187')
    d.rectangle((24, 16, 39, 18), fill='#f9e5a7')
    d.rectangle((30, 12, 33, 15), fill='#97decd')
    d.polygon([(32, 30), (34, 34), (38, 36), (34, 38), (32, 42), (30, 38), (26, 36), (30, 34)], fill='#fff1c5')
    atlas.paste(icon, (64, 576))  # sprite 71, after dual blades in row ten
    assert atlas.crop((0, 0, 384, 576)).tobytes() == before.crop((0, 0, 384, 576)).tobytes()
    assert atlas.crop((0, 576, 64, 640)).tobytes() == before.crop((0, 576, 64, 640)).tobytes()
    assert atlas.crop((128, 576, 384, 640)).tobytes() == before.crop((128, 576, 384, 640)).tobytes()
    atlas.save(path, optimize=True)
    atlas.resize((768, atlas.height*2), Image.Resampling.NEAREST).save(path.with_name('pixel-weapons-preview.png'))
    preview = Image.new('RGB', (256, 256), '#132331')
    icon = icon.resize((256, 256), Image.Resampling.NEAREST)
    preview.paste(icon, (0, 0), icon)
    preview.save(path.with_name('pixel-meme-king-preview.png'))


if __name__ == '__main__':
    generate()
