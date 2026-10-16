#!/usr/bin/env python3
"""Four original enemies on the existing 96px grid; never rewrite older atlases."""
from pathlib import Path
import math
from PIL import Image, ImageDraw
from draw_actor_art import pose

ROOT = Path(__file__).resolve().parents[1]
KINDS = ['mossguard', 'reaper', 'emberhorn', 'boneraven']
INK = '#111c28'
BONE = '#d1d2b6'
LIGHT = '#eee4c2'

def sprite(kind, frame):
    im = Image.new('RGBA', (96, 96))
    d = ImageDraw.Draw(im)
    p = pose(frame)
    step, bob, attack, lean = p['step'], p['bob'], p['attack'], p['lean']
    def poly(pts, color): d.polygon([(round(x), round(y)) for x, y in pts], fill=color)
    def line(pts, color, width=1): d.line([(round(x), round(y)) for x, y in pts], fill=color, width=width)
    def box(rect, color): d.rectangle(tuple(round(x) for x in rect), fill=color)
    def limb(pts, color, width=4):
        line(pts, INK, width+3)
        line(pts, color, width)
    def diamond(x, y, r, color): poly([(x,y-r),(x+r,y),(x,y+r),(x-r,y)],color)

    if kind == 'mossguard':
        # Torn mail skirt, broad shoulders and separate heavy boots.
        for x, off in [(36,step),(53,-step)]:
            limb([(x,61),(x+off/2,73),(x+off,82)],'#69776c',6)
            poly([(x+off-6,78),(x+off+5,78),(x+off+9,85),(x+off-7,85)],INK)
            box((x+off-4,80,x+off+5,83),'#8a927b')
            line([(x+off-4,80),(x+off+4,80)],'#c0c0a0')
        poly([(30,48),(59,48),(64,71),(56,75),(50,72),(41,76),(26,71)],INK)
        poly([(33,50),(56,50),(59,69),(53,71),(47,68),(40,72),(30,68)],'#354e4e')
        for y in [58,63,68]: line([(32,y),(39,y+2),(47,y),(55,y+2)],'#607569')
        poly([(31+lean,31+bob),(54+lean,30+bob),(63+lean,41),(57,59),(33,61),(23+lean,43)],INK)
        poly([(32+lean,34+bob),(52+lean,33+bob),(58+lean,41),(53,56),(35,57),(28+lean,43)],'#798a7a')
        poly([(36+lean,37),(49+lean,36),(53+lean,42),(48,49),(35,48)],'#a4ac91')
        line([(33,52),(52,53)],'#334c4f',3)
        diamond(43+lean,43,5,'#354b50');diamond(43+lean,43,3,'#c1b17b')
        for x in [25,55]:
            poly([(x-7+lean,34),(x+4+lean,30),(x+10+lean,40),(x+6+lean,47),(x-9+lean,44)],INK)
            poly([(x-4+lean,35),(x+3+lean,34),(x+6+lean,40),(x+4+lean,43),(x-6+lean,41)],'#83917c')
            line([(x-4+lean,36),(x+3+lean,35)],'#c3c5a1')
        # Broken spear carried behind the shield.
        limb([(27+lean,42),(20,49),(22,59)],'#718375',5)
        line([(16,28),(20,82)],INK,5);line([(16,28),(20,82)],'#817756',2)
        poly([(12,29),(14,13),(17,8),(22,25),(18,33)],INK)
        poly([(15,27),(16,15),(19,25),(17,29)],BONE)
        # Sealed helmet with a dark slit and two warm eye pixels.
        poly([(32+lean,13+bob),(42+lean,8+bob),(54+lean,13+bob),(57+lean,27+bob),(49+lean,36+bob),(33+lean,32+bob),(28+lean,23+bob)],INK)
        poly([(34+lean,15+bob),(42+lean,12+bob),(51+lean,15+bob),(53+lean,26+bob),(47+lean,32+bob),(35+lean,29+bob),(32+lean,22+bob)],'#8f9b84')
        line([(34+lean,18+bob),(50+lean,18+bob)],'#c5c6a4',2)
        box((33+lean,22+bob,52+lean,25+bob),'#233c42')
        box((38+lean,23+bob,40+lean,23+bob),'#f1cb87');box((47+lean,23+bob,49+lean,23+bob),'#f1cb87')
        line([(43+lean,13+bob),(44+lean,21+bob)],'#b9bfa0',2)
        # Kite shield opens sideways during the bash, exposing the torso.
        sx = [3,6,11,3][attack] if attack >= 0 else 0
        sy = [-3,-5,1,0][attack] if attack >= 0 else bob
        shield = [(55+sx,37+sy),(71+sx,33+sy),(82+sx,41+sy),(79+sx,65+sy),(67+sx,80+sy),(54+sx,68+sy),(50+sx,48+sy)]
        poly(shield,INK)
        poly([(57+sx,40+sy),(70+sx,37+sy),(78+sx,43+sy),(75+sx,63+sy),(67+sx,74+sy),(58+sx,65+sy),(54+sx,49+sy)],'#88947b')
        poly([(59+sx,43+sy),(70+sx,40+sy),(74+sx,45+sy),(71+sx,62+sy),(67+sx,68+sy),(61+sx,61+sy),(58+sx,49+sy)],'#334e51')
        line([(66+sx,42+sy),(65+sx,61+sy),(68+sx,69+sy)],'#aaa97e',2)
        diamond(65+sx,51+sy,5,'#a8ac85');diamond(65+sx,51+sy,2,'#e5d9ad')
        for x,y in [(57,40),(73,43),(59,62),(69,67)]:box((x+sx,y+sy,x+sx+1,y+sy+1),'#ded3a4')
        for x,y in [(30,14),(27,37),(55,33),(74+sx,58+sy),(58+sx,66+sy)]:
            box((x,y,x+4,y+2),'#536d4e');box((x+1,y-2,x+3,y),'#96a175')
        line([(48,14),(46,18),(48,20)],'#4a655e');line([(72+sx,46+sy),(70+sx,53+sy),(73+sx,58+sy)],'#1f353d')

    elif kind == 'reaper':
        # A thin hood and long split robes distinguish it from the bell priest.
        for x,off in [(38,step),(51,-step)]:limb([(x,67),(x+off,82)],'#7c8580',3)
        poly([(33+lean,31+bob),(53+lean,31+bob),(60+lean,44),(57,62),(65+p['sway'],78),(56,80),(52,85),(45,80),(38,84),(30,79),(23+p['sway'],83),(27,67),(29+lean,45)],INK)
        poly([(35+lean,35+bob),(50+lean,35+bob),(55+lean,44),(52,61),(58+p['sway'],76),(51,74),(48,80),(43,75),(36,79),(29,76),(33,59),(32+lean,45)],'#394d57')
        poly([(35+lean,37),(40+lean,36),(38,59),(32,74),(29,76)],'#6b7e7b')
        line([(46+lean,43),(46,61),(52,75)],'#84908a',2)
        line([(42+lean,44),(39,61),(40,74)],'#1d333f',2)
        line([(31,72),(36,75),(40,72),(47,76),(52,72),(57,75)],'#a29876')
        line([(31,48),(53,48)],'#796e59',3);diamond(42,48,3,'#c4b181')
        # Hood peaks into a dry branch crown.
        poly([(26+lean,26+bob),(33+lean,14+bob),(42+lean,6+bob),(49+lean,12+bob),(56+lean,23+bob),(54+lean,37+bob),(29+lean,37+bob)],INK)
        poly([(30+lean,26+bob),(36+lean,17+bob),(42+lean,11+bob),(47+lean,17+bob),(51+lean,25+bob),(49+lean,33+bob),(33+lean,33+bob)],'#657772')
        poly([(34+lean,25+bob),(41+lean,19+bob),(48+lean,24+bob),(48+lean,30+bob),(42+lean,36+bob),(35+lean,31+bob)],'#192e39')
        poly([(36+lean,26+bob),(42+lean,23+bob),(47+lean,26+bob),(45+lean,33+bob),(40+lean,34+bob),(36+lean,31+bob)],BONE)
        box((36+lean,27+bob,39+lean,29+bob),'#263941');box((43+lean,27+bob,46+lean,29+bob),'#263941')
        box((40+lean,31+bob,42+lean,32+bob),'#6d776a')
        for side in [-1,1]:
            line([(42+side*6+lean,16+bob),(42+side*12+lean,9+bob),(42+side*12+lean,4+bob)],'#68756a',3)
        # Articulated two-handed hooked scythe, with a pale cutting edge.
        reach = [-4,-2,4,2][attack] if attack >= 0 else 0
        top = [-4,-7,10,1][attack] if attack >= 0 else 0
        limb([(53+lean,40),(59+reach,49),(69+reach,45)],'#85958a',4)
        limb([(33+lean,41),(37,53),(58+reach,57)],'#78897d',4)
        line([(65+reach,20+top),(60+reach,83)],INK,6);line([(65+reach,20+top),(60+reach,82)],'#8b795a',3)
        line([(64+reach,30+top),(61+reach,72)],'#c1ad7d')
        poly([(60+reach,22+top),(65+reach,12+top),(80+reach,13+top),(89+reach,22+top),(90+reach,34+top),(84+reach,41+top),(84+reach,29+top),(79+reach,24+top),(66+reach,25+top)],INK)
        poly([(64+reach,21+top),(67+reach,16+top),(78+reach,17+top),(85+reach,24+top),(86+reach,33+top),(83+reach,28+top),(78+reach,22+top)],'#a0afa3')
        line([(66+reach,16+top),(78+reach,17+top),(85+reach,24+top),(86+reach,33+top)],LIGHT,2)
        for y in [44,55,66]:line([(60+reach,y),(64+reach,y+1)],'#d2c299',2)
        for x,y in [(32,61),(51,63),(35,72)]:line([(x,y),(x+2,y+5)],'#a2a58b')

    elif kind == 'emberhorn':
        # Low, broad charcoal boar: a chipped mane and amber seams, never neon.
        crouch = [3,5,-2,0][attack] if attack >= 0 else bob
        shift = [-3,-5,3,1][attack] if attack >= 0 else 0
        for x,off in [(25,step),(36,-step),(60,-step),(71,step)]:
            limb([(x,57+crouch),(x+off,72),(x+off-3,82)],'#56565a',6)
            poly([(x+off-7,79),(x+off+2,79),(x+off+4,85),(x+off-8,85)],INK)
            box((x+off-5,81,x+off+1,83),'#a49981')
        line([(21,50+crouch),(10,45+crouch),(6,35+crouch)],INK,6)
        line([(20,49+crouch),(11,43+crouch),(8,36+crouch)],'#66605b',3)
        poly([(17,39+crouch),(27,29+crouch),(52,30+crouch),(67,37+crouch),(74,48+crouch),(68,64+crouch),(43,68+crouch),(20,59+crouch),(14,48+crouch)],INK)
        poly([(21,41+crouch),(30,34+crouch),(50,35+crouch),(63,40+crouch),(68,49+crouch),(63,60+crouch),(43,63+crouch),(24,56+crouch),(19,48+crouch)],'#5d5e5d')
        for x,y in [(26,37),(38,34),(51,36)]:
            poly([(x,y+crouch),(x+9,y-2+crouch),(x+13,y+8+crouch),(x+6,y+15+crouch),(x-3,y+9+crouch)],'#7d7f71')
            line([(x+1,y+2+crouch),(x+7,y+crouch)],'#b4ae91',2)
        for x in [27,35,43,51,59]:
            poly([(x-4,34+crouch),(x-2,18+(x%3)*3+crouch),(x+4,26+crouch),(x+7,35+crouch)],INK)
            poly([(x-1,31+crouch),(x,23+(x%3)*3+crouch),(x+4,33+crouch)],'#8f8b75')
        for x,y in [(28,50),(44,53),(56,45)]:
            line([(x,y+crouch),(x+5,y+3+crouch),(x+2,y+8+crouch)],'#c29165',2)
            box((x+3,y+3+crouch,x+4,y+4+crouch),'#f4c78a')
        poly([(58+shift,34+crouch),(65+shift,26+crouch),(76+shift,30+crouch),(79+shift,40+crouch),(88+shift,44+crouch),(89+shift,55+crouch),(77+shift,62+crouch),(62+shift,57+crouch),(54+shift,46+crouch)],INK)
        poly([(61+shift,36+crouch),(67+shift,31+crouch),(73+shift,34+crouch),(75+shift,44+crouch),(84+shift,47+crouch),(84+shift,53+crouch),(76+shift,57+crouch),(64+shift,53+crouch),(59+shift,45+crouch)],'#88816c')
        poly([(64+shift,34+crouch),(65+shift,23+crouch),(72+shift,30+crouch)],INK)
        line([(67+shift,33+crouch),(66+shift,28+crouch)],'#b8a587',2)
        box((70+shift,41+crouch,77+shift,44+crouch),'#29323a');box((73+shift,42+crouch,76+shift,43+crouch),'#efb171')
        line([(80+shift,49+crouch),(84+shift,49+crouch)],'#343d43',2)
        # Hooked horn rises forward above the head; two smaller ivory tusks.
        poly([(72+shift,36+crouch),(76+shift,24+crouch),(84+shift,18+crouch),(86+shift,9+crouch),(91+shift,17+crouch),(90+shift,28+crouch),(80+shift,39+crouch)],INK)
        poly([(76+shift,34+crouch),(80+shift,26+crouch),(87+shift,20+crouch),(88+shift,16+crouch),(87+shift,27+crouch),(80+shift,35+crouch)],'#c0ac85')
        line([(79+shift,32+crouch),(86+shift,25+crouch)],'#f3d1a0',2)
        poly([(76+shift,54+crouch),(79+shift,60+crouch),(85+shift,60+crouch),(88+shift,52+crouch),(84+shift,56+crouch)],BONE)
        line([(63+shift,46+crouch),(66+shift,50+crouch)],'#b3a488')

    else:
        # A bone mask, loose leg fetters, split tail and layered raven primaries.
        flap = [0,-2,-5,0,5,3][(frame-2)%6] if 2 <= frame < 8 else bob
        if attack >= 0: flap = [-3,-7,4,1][attack]
        poly([(37,58),(31,76),(38,71),(40,82),(47,70),(52,78),(56,62)],INK)
        poly([(40,59),(36,72),(42,68),(43,75),(48,66),(51,72),(52,61)],'#536976')
        line([(42,60),(40,71)],'#91a39a',2)
        for side in [-1,1]:
            x = 46+side*12
            limb([(46+side*7,58),(x,67),(x+side*3,71)],'#a7ad98',3)
            for j in range(3):
                xx=x+side*j*2
                d.rectangle((xx-2,70+j*4,xx+1,73+j*4),outline='#929c95',width=1)
        for side in [-1,1]:
            poly([(46+side*6,35+bob),(46+side*18,28+flap),(46+side*34,20+flap),(46+side*42,34+flap),(46+side*35,36+flap),(46+side*37,44+flap),(46+side*29,44+flap),(46+side*30,53+flap),(46+side*22,50+flap),(46+side*18,57+flap),(46+side*8,52)],INK)
            poly([(46+side*9,37+bob),(46+side*19,33+flap),(46+side*32,26+flap),(46+side*36,32+flap),(46+side*30,34+flap),(46+side*32,40+flap),(46+side*25,39+flap),(46+side*25,47+flap),(46+side*18,44+flap),(46+side*16,50+flap),(46+side*9,47)],'#496271')
            line([(46+side*11,40),(46+side*20,36+flap),(46+side*30,29+flap)],'#8c9f9d',2)
            for j in range(3):line([(46+side*(17+j*5),36+flap),(46+side*(19+j*5),43+flap-j*3)],'#637f88',2)
        poly([(36,33+bob),(49,29+bob),(57,39+bob),(57,55),(49,65),(39,61),(33,47)],INK)
        poly([(39,36+bob),(48,33+bob),(53,41+bob),(53,53),(48,60),(42,57),(37,46)],'#6c8389')
        for y in [42,47,52]:
            line([(39,y),(45,y+2),(51,y)],'#b5c0ae',2)
        line([(45,37),(45,57)],'#2f4857')
        # Skull mask has a long beak and a clearly readable amber eye.
        poly([(37,17+bob),(48,11+bob),(59,16+bob),(61,24+bob),(74,30+bob),(59,35+bob),(52,40+bob),(39,35+bob),(33,26+bob)],INK)
        poly([(39,19+bob),(48,15+bob),(56,19+bob),(57,27+bob),(66,30+bob),(56,31+bob),(51,35+bob),(41,31+bob),(37,25+bob)],BONE)
        line([(42,19+bob),(49,17+bob),(54,20+bob)],LIGHT,2)
        poly([(47,23+bob),(55,22+bob),(54,28+bob),(49,29+bob)],'#233b48')
        box((51,24+bob,54,25+bob),'#ecc78c')
        line([(58,29+bob),(64,30+bob)],'#8a9484')
        line([(41,21+bob),(43,25+bob),(41,28+bob)],'#7b8e86')
        poly([(36,22+bob),(29,18+bob),(32,27+bob),(30,32+bob),(38,31+bob)],'#293f50')
        diamond(46,56,4,'#c4aa7d');diamond(46,56,2,'#eee1b1')
        if attack >= 0:
            x,y=66+[0,1,7,1][attack],48
            for j in range(3):
                a=j*math.tau/3+attack*.7
                line([(x,y),(x+math.cos(a)*8,y+math.sin(a)*8)],LIGHT,2)
    return im

def generate():
    out=ROOT/'public'/'art'
    atlas=Image.new('RGBA',(1152,384))
    review=Image.new('RGB',(768,768),'#17232d')
    frames=[]
    for row,kind in enumerate(KINDS):
        for f in range(12):
            tile=sprite(kind,f)
            bounds=tile.getbbox()
            assert bounds and bounds[0]>0 and bounds[1]>0 and bounds[2]<96 and bounds[3]<96,(kind,f,bounds)
            atlas.paste(tile,(f*96,row*96))
        for col,f in enumerate([0,3,6,10]):
            tile=sprite(kind,f).resize((192,192),Image.Resampling.NEAREST)
            review.paste(tile,(col*192,row*192),tile)
    atlas.save(out/'pixel-dusk-foes.png',optimize=True)
    review.save(out/'pixel-dusk-foes-preview.png',optimize=True)
    for f in range(12):
        canvas=Image.new('RGB',(768,192),'#17232d')
        for i,kind in enumerate(KINDS):
            tile=sprite(kind,f).resize((192,192),Image.Resampling.NEAREST)
            canvas.paste(tile,(i*192,0),tile)
        frames.append(canvas)
    frames[0].save(out/'pixel-dusk-foes-motion.gif',save_all=True,append_images=frames[1:],duration=125,loop=0,disposal=2)

if __name__=='__main__':generate()
