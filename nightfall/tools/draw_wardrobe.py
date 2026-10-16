"""Eight outfits, six hairstyles and six mask overlays on the native 96px grid."""
from pathlib import Path
from PIL import Image, ImageDraw
from draw_actor_art import wanderer, pose, limb, INK, GOLD, IVORY

ROOT = Path(__file__).resolve().parents[1]
OUTFITS = ['wanderer', 'nightcoat', 'knight', 'ranger', 'mage', 'crimson', 'frost', 'sakura']
HAIR = ['hood', 'short', 'ponytail', 'long', 'braid', 'bob']
MASKS = ['crescent', 'fox', 'oni', 'raven', 'visor', 'iron']
TONES = [('#284b4b', '#3e7565', '#779776'), ('#202938', '#414b60', '#a7b6c9'), ('#bfc3b3', '#e4e0c9', '#f3d58d'), ('#384c3d', '#65754b', '#a8ba85'), ('#363251', '#62527f', '#a998cf'), ('#602c43', '#a04460', '#e19b99'), ('#6c9ca7', '#b9d9d9', '#edf2df'), ('#6e4b68', '#b77d9a', '#ebbad0')]
BASE_HAIR = ['#bfcfc0', '#f0f0d4', '#8ea99e', '#c2d1bc']


def body(frame, outfit):
    if outfit == 'wanderer':
        return wanderer(frame)
    im = Image.new('RGBA', (96, 96)); d = ImageDraw.Draw(im)
    p = pose(frame); s, b, q, k, a = [p[x] for x in ['step', 'bob', 'sway', 'lean', 'attack']]
    dark, mid, light = TONES[OUTFITS.index(outfit)]
    # Cloak, long coat, robe, and kimono have different hems and shoulders.
    if outfit in ['nightcoat', 'crimson', 'frost']:
        hem = 80 if outfit != 'frost' else 74
        d.polygon([(37+k, 33), (26+k, 39), (24+q, 65), (17+q, hem), (35, hem-3), (43, 72), (57, hem-1), (64+k, 46), (55+k, 33)], fill=INK)
        d.polygon([(37+k, 36), (29+k, 41), (28+q, 65), (23+q, hem-4), (35, hem-7), (42, 68), (54, hem-6), (60+k, 46), (53+k, 36)], fill=dark)
        d.line([(30+k, 43), (29+q, 65), (25+q, hem-5)], fill=light, width=2)
        if outfit == 'crimson':
            for j in range(4): d.line([(25+q+j*6, hem-7), (28+q+j*6, hem-12)], fill=GOLD)
    elif outfit == 'ranger':
        d.polygon([(29+k, 35), (38+k, 31), (56+k, 34), (65+k, 43), (58, 57), (47, 51), (34, 56), (24+q, 48)], fill=INK)
        d.polygon([(31+k, 37), (39+k, 34), (55+k, 37), (61+k, 44), (56, 52), (47, 47), (34, 52), (28+q, 47)], fill=mid)
        d.line([(32+k, 39), (34, 48), (43, 46)], fill=light)
    elif outfit in ['mage', 'sakura']:
        d.polygon([(34+k, 35), (56+k, 34), (64+k, 47), (57, 63), (65+q, 83), (49, 86), (39, 80), (28+q, 85), (32, 60), (27+k, 47)], fill=INK)
        d.polygon([(36+k, 38), (54+k, 37), (59+k, 48), (53, 62), (59+q, 80), (49, 82), (40, 75), (33+q, 80), (37, 61), (32+k, 47)], fill=dark)
        d.polygon([(45+k, 40), (50+k, 39), (48, 62), (54, 79), (48, 79), (42, 62)], fill=mid)
        d.line([(35+q, 78), (41, 72), (49, 79), (57+q, 77)], fill=light, width=2)
        if outfit == 'mage':
            for x,y in [(38+q,70),(51+q,72),(45,55)]:
                d.line([(x-2,y),(x+2,y)],fill=GOLD);d.line([(x,y-2),(x,y+2)],fill=GOLD)
    # Articulated boots remain readable under all hems.
    for x, off in [(41,s), (53,-s)]:
        limb(d, [(x,64),(x+off//2,74),(x+off-2,81)], dark, 5, light)
        d.polygon([(x+off-5,79),(x+off+3,79),(x+off+4,84),(x+off-8,84)],fill=INK)
        d.rectangle((x+off-5,80,x+off+2,82),fill=mid)
    d.polygon([(37+k,35+b),(52+k,34+b),(58+k,43+b),(54+k,61),(43+k,65),(34+k,55),(33+k,43)],fill=INK)
    d.polygon([(39+k,38+b),(51+k,37+b),(54+k,44),(51+k,59),(43+k,61),(37+k,53),(36+k,43)],fill=mid)
    if outfit == 'knight':
        for y in [42,47,52]: d.line([(38+k,y),(44+k,y+2),(52+k,y)],fill=light,width=2)
        for x in [31,54]:
            d.polygon([(x+k,37),(x+8+k,35),(x+12+k,42),(x+5+k,46),(x-2+k,43)],fill=dark,outline=light)
        d.polygon([(42+k,58),(51+k,58),(54,74),(46,71),(39,76)],fill='#856557',outline=GOLD)
    elif outfit in ['nightcoat', 'crimson']:
        d.line([(41+k,38),(47+k,49),(52+k,39)],fill=light,width=2)
        for x in [43,49]:
            for y in [49,54]: d.point((x+k,y),fill=GOLD)
    elif outfit == 'sakura':
        d.line([(38+k,38),(51+k,52),(40+k,57)],fill=light,width=3)
        d.rectangle((36+k,54,54+k,60),fill='#ddd1aa')
        d.rectangle((43+k,54,49+k,60),fill=dark)
        d.polygon([(52+k,56),(61+k,52),(64+k,61),(54+k,60)],fill=light)
    elif outfit == 'ranger':
        d.line([(37+k,39),(53+k,59)],fill='#aa865a',width=4)
        for y in [44,50]: d.rectangle((42+k,y,45+k,y+2),fill=GOLD)
    elif outfit == 'mage':
        d.line([(39+k,39),(44+k,47),(51+k,39)],fill=GOLD,width=2)
        d.polygon([(46+k,46),(49+k,49),(46+k,53),(43+k,49)],fill='#c1c5ef')
    d.line([(36+k,59),(54+k,60)],fill='#6e533b',width=3)
    d.rectangle((44+k,58,48+k,61),fill=GOLD)
    lh=(32-s//2,53+b) if a<0 else [(30,49),(40,39),(53,38),(39,49)][a]
    rh=(61+s//2,53+b) if a<0 else [(56,42),(66,43),(76,47),(65,51)][a]
    for shoulder, elbow, hand in [((37+k,40+b),(30+k,45+b),lh),((54+k,40+b),(59+k,45+b),rh)]:
        limb(d,[shoulder,elbow,hand],mid,7 if outfit in ['mage','sakura'] else 5,light)
        d.rectangle((hand[0]-2,hand[1]-1,hand[0]+2,hand[1]+3),fill='#a58b61')
        d.rectangle((hand[0],hand[1],hand[0]+2,hand[1]+1),fill='#d2b77f')
    if outfit == 'frost':
        d.line([(32+k,38+b),(38+k,34+b),(46+k,38+b),(55+k,35+b),(60+k,41+b)],fill=light,width=5)
        for x in [34,42,51,58]:d.line([(x+k,37+b),(x+k-2,41+b)],fill='#e0eee4',width=2)
    # Preserve the crescent weapon and wrist movement from the native hero.
    hx,hy=rh; original=wanderer(frame)
    weapon=Image.new('RGBA',(96,96));weapon.paste(original.crop((max(0,hx-16),hy-6,min(96,hx+16),min(96,hy+28))), (max(0,hx-16),hy-6))
    # Only copy the blade palette, so the new sleeves keep their own fabric.
    for y in range(96):
        for x in range(96):
            if weapon.getpixel((x,y))[:3] in [(190,207,175),(239,240,203)]: im.putpixel((x,y),weapon.getpixel((x,y)))
    return im


def hairstyle(frame, style, outfit):
    p=pose(frame); k,b,q=p['lean'],p['bob'],p['sway']
    im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
    if style=='hood':
        original=wanderer(frame);im.paste(original.crop((28+k,8+b,65+k,39+b)),(28+k,8+b))
        if outfit!='wanderer':
            dark,mid,light=TONES[OUTFITS.index(outfit)]
            colors={'#46695c':mid,'#9da882':light,'#284b4b':dark,'#3e7565':mid,'#779776':light,'#5a967a':light,'#1b333c':dark,'#5b7d69':mid}
            pixels=im.load()
            for y in range(96):
                for x in range(96):
                    v=pixels[x,y];h='#%02x%02x%02x'%v[:3]
                    if v[3] and h in colors:pixels[x,y]=tuple(bytes.fromhex(colors[h][1:]))+(v[3],)
        return im
    base,hi,shade,trim=BASE_HAIR
    def poly(points,c):d.polygon([(x+k,y+b) for x,y in points],fill=c)
    def line(points,c,w=1):d.line([(x+k,y+b) for x,y in points],fill=c,width=w)
    if style=='ponytail':
        poly([(37,19),(28,25),(31+q,38),(25+q,48),(34+q,44),(38+q,33),(42,24)],INK)
        poly([(36,22),(31,26),(34+q,36),(29+q,43),(34+q,39),(36+q,31),(40,24)],shade)
        line([(32,26),(35+q,34),(31+q,41)],hi,2)
    elif style in ['long','braid','bob']:
        bottom=48 if style=='long' else 39
        poly([(36,16),(49,12),(60,20),(61,34),(57+q//2,bottom),(47,39),(34+q//2,bottom),(32,27)],INK)
        poly([(38,18),(49,15),(57,22),(58,33),(54+q//2,bottom-4),(47,35),(37+q//2,bottom-4),(35,27)],shade)
        if style=='long':
            for x in [36,40,55]:line([(x,26),(x+q//2,44)],base,2)
    # Every exposed style has a full face, neck, eye and consistent head scale.
    poly([(40,19),(51,16),(59,23),(59,30),(55,36),(46,36),(39,30),(37,24)],INK)
    poly([(42,21),(51,19),(56,24),(57,29),(53,33),(47,33),(42,29),(40,24)],'#c8b297')
    line([(51,31),(55,30)],'#8c7768');line([(51,26),(55,26)],INK,2);line([(53,26),(54,26)],'#bbd8a2')
    poly([(34,24),(35,17),(41,11),(50,10),(58,16),(60,23),(53,21),(48,24),(45,21),(41,29),(37,31),(38,23)],base)
    if style=='short':
        poly([(34,21),(31,17),(38,17),(36,12),(44,14),(47,9),(53,14),(60,16),(57,20),(48,18),(41,23)],base)
        line([(38,17),(44,14),(50,14)],hi,2)
    elif style=='bob':
        poly([(34,21),(38,14),(48,12),(56,16),(59,22),(50,19),(44,23),(39,34),(34,35)],base)
        line([(36,23),(36,31),(39,33)],hi,2)
    else:line([(37,20),(42,15),(49,14),(54,17)],hi,2)
    line([(42,23),(39,29)],shade,2)
    if style=='braid':
        for j in range(6):
            x=36+q//2+(j%2);y=30+j*3
            poly([(x,y),(x+4,y+2),(x+2,y+5),(x-2,y+2)],shade)
            line([(x,y+1),(x+2,y+2)],hi)
        line([(36+q//2,48),(39+q//2,49)],GOLD,2)
    if style=='ponytail':d.rectangle((35+k,20+b,39+k,22+b),fill=GOLD)
    d.rectangle((56+k,22+b,57+k,24+b),fill=GOLD)
    return im


def face_mask(frame, style, hood=False):
    p=pose(frame); k,b=p['lean']+(2 if hood else 0),p['bob']
    im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
    def poly(points,c):d.polygon([(x+k,y+b) for x,y in points],fill=c)
    def line(points,c,w=1):d.line([(x+k,y+b) for x,y in points],fill=c,width=w)
    def box(bounds,c):x,y,r,t=bounds;d.rectangle((x+k,y+b,r+k,t+b),fill=c)
    def ellipse(bounds,c):x,y,r,t=bounds;d.ellipse((x+k,y+b,r+k,t+b),fill=c)
    face=[(40,20),(51,18),(59,22),(61,29),(55,36),(47,36),(39,30),(37,24)]
    if style=='crescent':
        poly(face,INK)
        poly([(41,22),(51,20),(57,23),(58,29),(54,33),(48,34),(41,29),(40,24)],'#dedaca')
        poly([(41,22),(51,20),(55,22),(49,24),(42,26)],'#faf0d8')
        poly([(42,25),(47,24),(47,26),(44,27)],INK)
        poly([(52,26),(57,25),(56,28),(52,28)],INK)
        ellipse((48,20,53,25),'#b68e4f');ellipse((50,19,54,23),'#dedaca')
        line([(50,29),(52,32),(54,30)],'#a78e6c')
        line([(41,28),(43,31)],'#b68e4f',2)
    elif style=='fox':
        poly([(38,25),(37,12),(45,18),(52,18),(60,11),(62,27),(58,33),(51,37),(44,33)],INK)
        poly([(40,24),(40,16),(46,21),(52,20),(58,15),(59,27),(56,31),(51,34),(45,31)],'#f0e5cc')
        poly([(41,18),(44,22),(41,23)],'#b9545b');poly([(57,17),(57,22),(54,22)],'#b9545b')
        line([(42,25),(47,26),(44,28)],'#983b4c',2)
        line([(52,26),(57,24),(56,28)],'#983b4c',2)
        poly([(49,29),(53,29),(51,31)],'#983b4c')
        line([(46,30),(47,32)],'#d48075',2);line([(56,29),(54,32)],'#d48075',2)
    elif style=='oni':
        poly([(39,25),(44,23),(51,25),(58,23),(61,28),(58,35),(50,38),(41,34)],INK)
        poly([(41,27),(46,26),(51,28),(57,26),(58,30),(55,34),(50,35),(44,32)],'#ad4e54')
        line([(41,27),(46,28),(48,26)],'#ed9b76',2);line([(52,27),(57,25)],'#e9b17b',2)
        line([(46,32),(54,32)],'#432a3a',2)
        poly([(44,30),(47,31),(47,36),(44,34)],'#f6e1b3')
        poly([(54,30),(57,29),(56,34),(53,36)],'#f6e1b3')
        poly([(39,26),(38,19),(42,23),(44,25)],'#cdae72')
        poly([(57,24),(59,18),(60,26)],'#cdae72')
        box((49,30,51,31),'#eea17d')
    elif style=='raven':
        poly(face,INK)
        poly([(41,22),(50,20),(57,23),(58,29),(52,33),(43,31),(40,27)],'#3e4d64')
        line([(41,23),(47,22),(51,24),(57,23)],'#9ba6b6',2)
        ellipse((43,25,48,29),INK);ellipse((44,25,47,27),'#8bd7dc')
        ellipse((53,25,58,29),INK);ellipse((54,25,57,27),'#8bd7dc')
        poly([(50,28),(56,27),(68,32),(57,37),(51,33)],INK)
        poly([(53,29),(56,29),(64,32),(57,33)],'#78899d')
        line([(54,34),(61,33)],'#4e627c')
    elif style=='visor':
        line([(36,25),(42,25)],INK,4)
        poly([(39,23),(48,22),(52,24),(60,23),(61,29),(52,31),(48,29),(40,30)],INK)
        poly([(41,24),(48,24),(52,26),(58,25),(58,28),(52,29),(48,27),(42,28)],'#439aab')
        line([(42,24),(47,24),(52,26),(57,25)],'#c2f1df',2)
        box((42,27,44,27),'#7adbc8');box((54,27,57,27),'#7adbc8')
        line([(40,22),(47,21)],'#8ca7c8')
        box((38,24,40,28),'#b8ad8c')
    elif style=='iron':
        poly(face,INK)
        poly([(41,22),(51,20),(57,23),(59,29),(54,34),(47,34),(41,29)],'#647078')
        poly([(43,23),(50,21),(53,24),(49,29),(42,27)],'#9ba49f')
        poly([(41,25),(48,24),(49,27),(42,28)],INK)
        poly([(52,26),(57,25),(57,28),(52,28)],INK)
        line([(43,25),(46,25)],'#e8c778');line([(53,26),(56,26)],'#e8c778')
        poly([(45,29),(55,29),(55,32),(51,35),(46,32)],'#303c4b')
        for x in [47,50,53]:line([(x,30),(x,33)],'#bfa16c')
        line([(41,23),(41,28)],'#d6c098');box((57,23,58,24),'#d6c098')
    return im


def generate():
    body_rows=len(OUTFITS)*len(HAIR)
    atlas=Image.new('RGBA',(96*12,96*(body_rows+len(MASKS)*2)))
    preview=Image.new('RGB',(8*160,6*160),'#142331')
    for oi,outfit in enumerate(OUTFITS):
        for hi,hair in enumerate(HAIR):
            row=oi*len(HAIR)+hi
            for frame in range(12):
                im=body(frame,outfit);p=pose(frame)
                if outfit=='wanderer':
                    ImageDraw.Draw(im).rectangle((28+p['lean'],8+p['bob'],64+p['lean'],38+p['bob']),fill=(0,0,0,0))
                im.alpha_composite(hairstyle(frame,hair,outfit))
                atlas.paste(im,(frame*96,row*96))
                if frame==0:
                    tile=im.resize((160,160),Image.Resampling.NEAREST);preview.paste(tile,(oi*160,hi*160),tile)
    original=Image.open(ROOT/'public/art/pixel-actors.png').convert('RGBA')
    assert atlas.crop((0,0,1152,96)).tobytes()==original.crop((0,0,1152,96)).tobytes(),'Default hero must stay pixel-identical'
    mask_preview=Image.new('RGB',(len(MASKS)*160,320),'#142331')
    for mi,style in enumerate(MASKS):
        for hi,hood in enumerate([True,False]):
            for frame in range(12):
                overlay=face_mask(frame,style,hood)
                assert overlay.getbbox(),f'Empty mask: {style}, frame {frame}'
                atlas.paste(overlay,(frame*96,(body_rows+mi*2+hi)*96))
                if frame==0:
                    base=atlas.crop((0,(0 if hood else 3)*96,96,(1 if hood else 4)*96))
                    base.alpha_composite(overlay)
                    tile=base.crop((27,5,71,47)).resize((144,144),Image.Resampling.NEAREST)
                    mask_preview.paste(tile,(mi*160+8,hi*160+8),tile)
    atlas.save(ROOT/'public/art/pixel-wardrobe.png',optimize=True)
    preview.save(ROOT/'public/art/pixel-wardrobe-preview.png')
    mask_preview.save(ROOT/'public/art/pixel-masks-preview.png')


if __name__=='__main__':generate()
