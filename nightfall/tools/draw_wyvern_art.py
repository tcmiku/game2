"""Rigged 192px wyvern: eight poses each for flight, breath, dive and return.

All shapes are drawn at native resolution. No blur, resampling or random noise.
Run independently to replace only the wyvern resources and its weapon icon.
"""
from pathlib import Path
from math import sin, cos, pi
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CELL = 192
INK = '#101c29'
EDGE = '#283340'
SCALE = '#555460'
LIGHT = '#8c8588'
HORN = '#b9aa8d'
PALE = '#e1cfaa'
MODES = ('flight', 'breath', 'dive', 'return')


def ip(points):
    return [(round(x), round(y)) for x, y in points]


def curve(points, count=26):
    """Cubic Bézier, sampled into pixel segments for a flexible tapering tail."""
    a, b, c, d = points
    return [(a[0]*(1-t)**3+3*b[0]*t*(1-t)**2+3*c[0]*t*t*(1-t)+d[0]*t**3,
             a[1]*(1-t)**3+3*b[1]*t*(1-t)**2+3*c[1]*t*t*(1-t)+d[1]*t**3)
            for t in [i/count for i in range(count+1)]]


def wyvern(mode='flight', frame=0):
    im = Image.new('RGBA', (CELL, CELL))
    d = ImageDraw.Draw(im)
    phase = frame / 8 * 2*pi
    dive = mode == 'dive'
    fire = mode == 'breath'
    returning = mode == 'return'
    # An upstroke folds the wing fingers; a downstroke opens the whole fan.
    lift = cos(phase) if mode in ('flight', 'return') else (.55 if fire else [.75, .6, .25, -.1, -.4, -.15, .2, .55][frame])
    spread = .84 + .16*sin(phase)**2 if not dive else [1, .9, .74, .62, .66, .76, .86, .96][frame]
    bob = round(sin(phase)*2) if not dive else [0, -2, -3, -1, 2, 3, 2, 0][frame]
    neck = [0, -2, -3, -2, 0, 1, 1, 0][frame] if fire else round(sin(phase+.7)*2)
    open_jaw = [1, 4, 8, 9, 9, 7, 4, 1][frame] if fire else (3 if dive and 2 <= frame <= 5 else 0)

    def poly(points, fill, outline=None, width=1):
        d.polygon(ip(points), fill=fill)
        if outline:
            d.line(ip(points + [points[0]]), fill=outline, width=width, joint='curve')

    def wing(root, far=False):
        # Different foreshortening on the rear wing preserves the 3/4 silhouette.
        rx, ry = root
        side = 1 if far else -1
        reach = (58 if far else 76)*spread
        wrist = (rx+side*reach*.52, ry-24-lift*25)
        tip = (rx+side*reach, ry-35-lift*37)
        fingers = [tip, (rx+side*reach*.91, ry-3-lift*22),
                   (rx+side*reach*.66, ry+21-lift*13),
                   (rx+side*reach*.34, ry+36-lift*7)]
        notches = [((a[0]+b[0])/2-side*7, (a[1]+b[1])/2-7) for a, b in zip(fingers, fingers[1:])]
        contour = [root, wrist, fingers[0], notches[0], fingers[1], notches[1], fingers[2], notches[2], fingers[3], (rx, ry+14)]
        poly(contour, '#412e3c' if far else '#583542', INK, 3)
        # Large faceted leather panels; subtle veins are clipped to the membrane.
        palette = ['#5e3946', '#73434d', '#854e53', '#633c47'] if not far else ['#4c3240', '#613b47', '#6e424c', '#513541']
        for i in range(3):
            poly([root, wrist, fingers[i], notches[i], fingers[i+1]], palette[i])
            mid = ((root[0]+fingers[i+1][0])*.5, (root[1]+fingers[i+1][1])*.5)
            d.line(ip([wrist, mid, fingers[i+1]]), fill='#9b6060' if not far else '#794b54', width=1)
        poly([root, fingers[3], (rx, ry+14)], palette[3])
        for i, f in enumerate(fingers):
            d.line(ip([root, wrist, f] if i == 0 else [wrist, f]), fill=INK, width=4 if i == 0 else 3)
            d.line(ip([root, wrist, f] if i == 0 else [wrist, f]), fill='#b07b70' if not far else '#896668', width=2 if i == 0 else 1)
        # The wing arm has scale plates, an elbow ridge and a hooked thumb claw.
        d.line(ip([root, wrist]), fill='#56505c', width=7)
        d.line(ip([(rx-1, ry-2), (wrist[0]-1, wrist[1]-2)]), fill='#9c8b84', width=2)
        wx, wy = wrist
        poly([(wx-3, wy), (wx-2, wy-9), (wx+2, wy-14), (wx+4, wy-10), (wx+1, wy-4), (wx+3, wy)], HORN, INK)
        for t in [.2, .4, .6, .8]:
            x, y = rx+(wx-rx)*t, ry+(wy-ry)*t
            d.line(ip([(x-2, y-2), (x+2, y)]), fill=EDGE, width=1)

    wing((103, 91+bob), True)
    # Tail is behind the near wing and legs. The delayed tip swings in opposition.
    tail = curve([(84, 114+bob), (47, 149+sin(phase)*5),
                  (16, 135+sin(phase-.8)*14), (19, 97+sin(phase-1.4)*12)])
    for i in range(len(tail)-1):
        width = max(2, round(15*(1-i/len(tail))))
        d.line(ip(tail[i:i+2]), fill=INK, width=width+4)
    for i in range(len(tail)-1):
        width = max(1, round(12*(1-i/len(tail))))
        d.line(ip(tail[i:i+2]), fill='#494653', width=width)
        if i % 3 == 0 and i < 19:
            x, y = tail[i]
            d.line(ip([(x-2, y-3), (x+2, y-1)]), fill='#8f7d78', width=1)
            poly([(x, y-4), (x-4, y-10), (x+4, y-5)], HORN, INK)
    tx, ty = tail[-1]
    poly([(tx-2, ty+5), (tx-5, ty-4), (tx-1, ty-12), (tx+4, ty-4), (tx+2, ty+5)], '#9f8778', INK)

    def leg(back=False):
        x = 104 if back else 87
        y = 113+bob
        extend = [0, .15, .6, 1, 1, .7, .3, 0][frame] if dive else .12
        if returning: extend = .02
        knee = (x+3+extend*14, y+15-extend*9)
        ankle = (x+10+extend*29, y+30-extend*9)
        color = '#484653' if back else '#68606a'
        d.line(ip([(x, y), knee, ankle]), fill=INK, width=12)
        d.line(ip([(x, y), knee, ankle]), fill=color, width=8)
        d.line(ip([(x-2, y), (knee[0]-2, knee[1]), (ankle[0]-2, ankle[1]-2)]), fill='#9d8b86' if not back else '#716a72', width=2)
        ax, ay = ankle
        for i in range(3):
            dx, dy = i*4-4, i*2
            poly([(ax+dx-2, ay-2), (ax+dx+4, ay+dy), (ax+dx+6, ay+dy+5), (ax+dx+3, ay+dy+4), (ax+dx, ay+1)], PALE, INK)
        d.line(ip([(knee[0]-4, knee[1]), (knee[0]+3, knee[1]+2)]), fill=EDGE, width=2)

    leg(True)
    # Broad muscular chest, plated abdomen, a swept neck and angular skull.
    body = [(73, 96+bob), (84, 86+bob), (101, 85+bob), (116, 96+bob), (117, 109+bob), (109, 121+bob), (94, 128+bob), (79, 122+bob), (70, 109+bob)]
    poly(body, SCALE, INK, 3)
    poly([(76, 98+bob), (86, 90+bob), (100, 89+bob), (109, 99+bob), (98, 108+bob), (78, 108+bob)], '#6f6670')
    poly([(73, 110+bob), (88, 115+bob), (111, 107+bob), (109, 120+bob), (94, 125+bob), (79, 119+bob)], '#403d4a')
    # Overlapping scale clusters, offset between rows, stay inside the torso.
    mask = Image.new('L', (CELL, CELL)); ImageDraw.Draw(mask).polygon(ip(body), fill=255)
    scales = Image.new('RGBA', (CELL, CELL)); sd = ImageDraw.Draw(scales)
    for y in range(91+bob, 122+bob, 6):
        for x in range(75+(y//6 % 2)*3, 113, 7):
            sd.line([(x, y), (x+3, y+2), (x+6, y)], fill='#a18b84' if y < 106+bob else '#69606a', width=1)
            sd.line([(x+2, y+3), (x+4, y+3)], fill='#363542', width=1)
    scales.putalpha(Image.composite(scales.getchannel('A'), Image.new('L', (CELL, CELL)), mask))
    im.alpha_composite(scales)
    ny = neck+bob
    poly([(101, 101+bob), (112, 81+ny), (127, 71+ny), (140, 73+ny), (139, 84+ny), (125, 87+ny), (119, 106+bob), (111, 115+bob)], '#68616b', INK, 3)
    d.line(ip([(110, 100+bob), (118, 84+ny), (130, 77+ny), (137, 77+ny)]), fill=LIGHT, width=3)
    # Warm bone belly plates follow the curve from throat to breast.
    for x, y, width in [(133, 86+ny, 6), (127, 90+ny, 7), (124, 95+ny, 8), (121, 101+bob, 9), (117, 108+bob, 9), (110, 115+bob, 9), (101, 120+bob, 8)]:
        poly([(x-2, y-2), (x+width, y-1), (x+width-2, y+3), (x-3, y+2)], '#ad9481', EDGE)
        d.line(ip([(x, y-1), (x+width-1, y)]), fill='#d0b598', width=1)
    wing((83, 94+bob))
    leg(False)
    # Spines have darker bases and a lit tip; no extra front legs on a wyvern.
    for x, y, height in [(74, 98+bob, 8), (82, 88+bob, 10), (92, 85+bob, 11), (103, 83+bob, 10), (114, 77+ny, 9), (124, 71+ny, 8)]:
        poly([(x-3, y+2), (x-3, y-height), (x+4, y-2)], '#9d8a7c', INK)
        d.line(ip([(x-2, y-height+2), (x, y-3)]), fill=PALE, width=1)
    # Jaw moves independently; a warm throat is visible during the flame release.
    poly([(139, 82+ny), (155, 83+ny), (169, 87+ny), (164, 94+ny+open_jaw), (150, 95+ny+open_jaw), (137, 88+ny)], '#3e3443', INK, 2)
    if open_jaw:
        poly([(144, 85+ny), (166, 87+ny), (161, 91+ny+open_jaw), (148, 91+ny+open_jaw)], '#812f3d')
        d.line(ip([(148, 89+ny+open_jaw), (161, 89+ny+open_jaw)]), fill='#cc6c50' if fire else '#b77873', width=2)
    poly([(127, 75+ny), (134, 66+ny), (147, 65+ny), (155, 74+ny), (169, 79+ny), (173, 86+ny), (165, 90+ny), (152, 87+ny), (138, 86+ny)], '#696572', INK, 2)
    poly([(130, 75+ny), (137, 69+ny), (145, 69+ny), (149, 74+ny), (139, 78+ny)], '#9d8c8e')
    poly([(151, 77+ny), (166, 81+ny), (169, 85+ny), (154, 83+ny)], '#867780')
    # Twin swept horns, brow armor, nostril, teeth and the amber slit pupil.
    for points in [[(134, 70+ny), (128, 57+ny), (126, 47+ny), (131, 52+ny), (141, 67+ny)], [(145, 67+ny), (145, 56+ny), (153, 49+ny), (152, 56+ny), (151, 72+ny)]]:
        poly(points, HORN, INK, 2)
        d.line(ip([points[1], points[2]]), fill=PALE, width=1)
    d.line(ip([(139, 75+ny), (148, 74+ny), (152, 77+ny)]), fill=INK, width=3)
    d.rectangle((143, 76+ny, 149, 78+ny), fill='#f2b36a')
    d.line([(147, 76+ny), (147, 79+ny)], fill='#37283a', width=1)
    d.point((144, 76+ny), fill='#fff1c1')
    d.rectangle((166, 81+ny, 168, 82+ny), fill=INK)
    for x in [151, 157, 163]:
        poly([(x, 86+ny), (x+3, 87+ny), (x+1, 90+ny+min(3, open_jaw))], PALE)
    d.line(ip([(134, 81+ny), (139, 83+ny), (142, 81+ny)]), fill='#ad9290', width=1)
    if fire and 1 <= frame <= 6:
        # A short muzzle flash; the actual cone is drawn by the combat renderer.
        size = [0, 3, 7, 10, 8, 6, 3, 0][frame]
        poly([(168, 87+ny), (177, 85+ny-size/2), (174, 88+ny), (183, 87+ny), (177, 92+ny), (170, 91+ny)], '#cb754e')
        poly([(170, 88+ny), (177, 87+ny), (175, 90+ny), (170, 90+ny)], '#ffe3a4')
    return im


def generate(out=None):
    out = out or ROOT/'public/art'
    atlas = Image.new('RGBA', (CELL*8, CELL*4))
    for row, mode in enumerate(MODES):
        for col in range(8): atlas.paste(wyvern(mode, col), (col*CELL, row*CELL))
    atlas.save(out/'pixel-wyvern.png', optimize=True)
    preview = Image.new('RGB', (CELL*8, CELL*4), '#101e2c')
    preview.paste(atlas, (0, 0), atlas)
    preview.save(out/'pixel-wyvern-preview.png')
    animations = []
    for col in range(8):
        card = Image.new('RGB', (CELL*4, CELL), '#101e2c')
        for row, mode in enumerate(MODES):
            pose = wyvern(mode, col); card.paste(pose, (row*CELL, 0), pose)
        animations.append(card.resize((CELL*6, CELL*3//2), Image.Resampling.NEAREST))
    animations[0].save(out/'pixel-wyvern-motion.gif', save_all=True, append_images=animations[1:], duration=90, loop=0, disposal=2)
    # Only the evolved wyvern icon (sprite 73) is replaced. All other slots survive.
    weapons = Image.open(out/'pixel-weapons.png').convert('RGBA')
    before = weapons.copy(); n = 73-16; box = (n%6*64, n//6*64, n%6*64+64, n//6*64+64)
    icon = wyvern('breath', 3).resize((64, 64), Image.Resampling.NEAREST)
    weapons.paste(icon, box[:2])
    for index in range(16, 16+weapons.width//64*(weapons.height//64)):
        if index == 73: continue
        j = index-16; b = (j%6*64, j//6*64, j%6*64+64, j//6*64+64)
        assert before.crop(b).tobytes() == weapons.crop(b).tobytes(), index
    weapons.save(out/'pixel-weapons.png', optimize=True)
    weapons.resize((weapons.width*2, weapons.height*2), Image.Resampling.NEAREST).save(out/'pixel-weapons-preview.png')
    print('Wyvern: 32 native 192px poses; all other weapon icons preserved.')


if __name__ == '__main__': generate()
