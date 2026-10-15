#!/usr/bin/env python3
"""Draw all frontier scenery, destructibles, sprites and icons with Pillow.
No generated portrait is read or used by this drawing script.
"""
from pathlib import Path
import math,random
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]

def landscape():
    rng=random.Random(107);im=Image.new('RGB',(1200,800),'#17262b');d=ImageDraw.Draw(im)
    for _ in range(22000):
        x=rng.randrange(1200);y=rng.randrange(800);d.rectangle((x,y,x+rng.randrange(2,9),y+rng.randrange(1,4)),fill=rng.choice(['#1e3033','#213537','#293b3b','#1b2c31']))
    # A weathered crossroads, a ruined courtyard, eastern pools and southern stones.
    for y in range(80,755,13):
        cx=405+int(math.sin(y/83)*35)
        for x in range(cx-35,cx+42,16):
            d.polygon([(x,y),(x+13,y-2),(x+15,y+9),(x+1,y+11)],fill=rng.choice(['#344348','#3a4b4e','#405154']))
            d.line([(x+2,y),(x+11,y-1)],fill='#576360')
    for x in range(80,1125,16):
        cy=267+int(math.sin(x/100)*22)
        for y in range(cy-26,cy+34,13):
            d.polygon([(x,y),(x+13,y-1),(x+14,y+9),(x+1,y+11)],fill=rng.choice(['#34474b','#3c4e50','#2d4247']))
            d.line([(x+2,y),(x+11,y)],fill='#52625f')
    for cx,cy in [(905,530),(950,590),(851,594)]:
        d.ellipse((cx-58,cy-29,cx+58,cy+29),fill='#101f2c');d.ellipse((cx-52,cy-24,cx+52,cy+22),fill='#243d49')
        for _ in range(18):
            x=cx+rng.randrange(-43,43);y=cy+rng.randrange(-15,16);d.line([(x,y),(x+rng.randrange(2,10),y)],fill=rng.choice(['#355460','#45606b','#2b4a58']))
    for cx,cy in [(400,265),(800,210),(330,590)]:
        for radius,c in [(65,'#0d1e27'),(61,'#4c5b5c'),(55,'#273c42'),(48,'#68706b'),(45,'#2b4148')]:
            d.ellipse((cx-radius,cy-radius//2,cx+radius,cy+radius//2),fill=c)
        for k in range(12):
            a=k*math.tau/12;x=cx+round(math.cos(a)*54);y=cy+round(math.sin(a)*26)
            d.line([(x-2,y-2),(x+2,y+2),(x+3,y)],fill='#a2a391')
    # Broken columns and graves are flat scenic ruins; breakable loot uses separate sprites.
    for _ in range(70):
        x=rng.randrange(50,1150);y=rng.randrange(45,755)
        if abs(x-400)<100 and abs(y-267)<65:continue
        if rng.random()<.45:
            d.polygon([(x-6,y),(x+6,y-2),(x+14,y+9),(x+1,y+12)],fill='#0c1d27')
            d.rectangle((x-5,y-12,x+5,y+3),fill='#3a5057');d.line([(x-4,y-11),(x+3,y-11)],fill='#80918a')
            d.line([(x-3,y-9),(x-3,y)],fill='#5b7375');d.line([(x+2,y-7),(x,y-4),(x+2,y)],fill='#263f47')
        else:
            d.polygon([(x,y),(x+24,y-2),(x+30,y+7),(x+3,y+9)],fill='#1a2c34')
            d.polygon([(x,y-4),(x+24,y-6),(x+28,y+2),(x+3,y+5)],fill='#4c6061');d.line([(x+3,y-4),(x+22,y-5)],fill='#859084')
    for _ in range(1800):
        x=rng.randrange(1200);y=rng.randrange(800)
        d.line([(x,y),(x-2,y-4)],fill='#647359');d.line([(x+2,y),(x+3,y-3)],fill='#3d5d4e')
    for _ in range(100):
        x=rng.choice([rng.randrange(5,80),rng.randrange(1110,1195)]) if rng.random()<.65 else rng.randrange(1200)
        y=rng.randrange(800) if x<80 or x>1110 else rng.choice([rng.randrange(35),rng.randrange(755,800)])
        d.ellipse((x-25,y-12,x+34,y+18),fill='#0b1c26')
        for dx,dy,r in [(-10,-13,18),(12,-17,21),(0,-36,20)]:
            d.polygon([(x+dx,y+dy-r),(x+dx+r,y+dy),(x+dx+7,y+dy+r//2),(x+dx-r,y+dy+3)],fill='#213e40')
            d.line([(x+dx-r//2,y+dy-6),(x+dx,y+dy-r+3),(x+dx+r//2,y+dy-6)],fill='#416358',width=2)
    return im

def prop(kind):
    im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
    if kind==0:
        d.polygon([(12,24),(37,18),(52,27),(26,34)],fill='#a58c62');d.polygon([(12,24),(26,33),(26,52),(12,43)],fill='#594c3c');d.polygon([(26,33),(52,27),(52,46),(26,52)],fill='#796343')
        for x in [31,39,47]:d.line([(x,33-(x-26)//5),(x,49-(x-26)//5)],fill='#4c493b')
        d.line([(13,25),(26,33),(51,28)],fill='#d2b27b',width=2);d.line([(28,35),(49,44)],fill='#b79860',width=3);d.line([(30,48),(49,31)],fill='#b79860',width=3)
        for x,y in [(27,35),(49,32),(30,48),(49,44)]:d.rectangle((x,y,x+1,y+1),fill='#e6c78e')
    elif kind==1:
        d.polygon([(24,15),(40,15),(41,24),(50,33),(47,48),(41,54),(23,54),(17,46),(16,33),(23,24)],fill='#172635')
        d.polygon([(25,18),(39,18),(38,27),(46,34),(43,47),(38,51),(26,51),(21,44),(20,34),(27,26)],fill='#6e718d')
        d.rectangle((23,15,41,19),fill='#b9adb0');d.line([(24,20),(39,20)],fill='#4b536a');d.line([(24,31),(22,39),(25,46)],fill='#c4b5b4',width=2)
        d.line([(32,29),(37,34),(31,39),(37,45)],fill='#d6c4a0');d.line([(39,28),(41,36),(39,47)],fill='#454f67',width=2)
    else:
        d.polygon([(22,20),(42,20),(47,29),(44,47),(33,53),(20,47),(17,29)],fill='#172635')
        d.rectangle((22,22,42,43),fill='#a68759');d.rectangle((26,25,38,40),fill='#48443b');d.polygon([(28,39),(28,32),(32,26),(36,34),(36,39)],fill='#edb576');d.rectangle((30,33,33,39),fill='#fff0ae')
        for x in [23,39]:d.rectangle((x,22,x+2,43),fill='#d5b77d')
        d.polygon([(21,20),(31,14),(43,20)],fill='#b6a17b');d.line([(30,14),(30,10),(35,10),(36,14)],fill='#d1b886',width=2);d.rectangle((22,44,42,48),fill='#6c5f46')
    return im

def shield(artifact=False):
    im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im);edge='#e8ce8f' if artifact else '#a7cbd3';fill='#485b82' if artifact else '#416775'
    d.polygon([(31,8),(48,17),(46,36),(40,47),(31,55),(21,47),(15,36),(14,17)],fill='#132331')
    d.polygon([(31,11),(45,19),(43,35),(37,45),(31,51),(24,45),(18,35),(17,19)],fill=edge)
    d.polygon([(31,16),(40,22),(39,34),(35,42),(31,46),(27,42),(22,33),(22,22)],fill=fill)
    d.polygon([(31,19),(36,27),(31,40),(26,29)],fill='#dce9df');d.line([(31,19),(31,40)],fill='#f9f0c1',width=2)
    d.line([(19,19),(29,13),(40,19)],fill='#f6eac1');d.rectangle((44,12,46,16),fill=edge);d.rectangle((42,14,48,15),fill=edge)
    if artifact:
        d.arc((5,5,57,57),35,310,fill='#d5c993',width=2);d.line([(5,30),(10,26),(10,35),(5,30)],fill='#f8e5b2');d.rectangle((50,38,52,40),fill='#ece0b9')
    return im

def resident(kind,frame):
    im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im);bob=[0,1,0,-1][frame];green=kind==0
    cloak='#446255' if green else '#444868';light='#8d9e77' if green else '#a2a5bd';hair='#a47450' if green else '#bec5c1'
    d.polygon([(23,23+bob),(40,23+bob),(45,37),(49,54),(34,58),(16,55),(21,36)],fill='#12222d');d.polygon([(25,25+bob),(38,25+bob),(41,39),(45,53),(32,55),(20,52),(25,37)],fill=cloak)
    d.line([(24,29),(23,44),(20,51)],fill=light,width=2);d.line([(38,30),(41,49)],fill='#283947',width=2)
    d.polygon([(23,12+bob),(31,8+bob),(40,12+bob),(42,24+bob),(35,30+bob),(25,26+bob),(21,20+bob)],fill='#15232c')
    d.polygon([(24,14+bob),(31,11+bob),(38,14+bob),(39,23+bob),(34,27+bob),(27,25+bob)],fill='#d6ba96')
    d.polygon([(23,13+bob),(30,9+bob),(39,12+bob),(41,19+bob),(34,16+bob),(26,17+bob),(23,24+bob)],fill=hair)
    d.rectangle((29,20+bob,31,21+bob),fill='#27323b');d.rectangle((35,20+bob,37,21+bob),fill='#27323b')
    if green:
        d.line([(25,19+bob),(25,31),(28,38)],fill=hair,width=3);d.rectangle((22,13+bob,25,15+bob),fill='#d9d6ae')
        d.polygon([(23,34),(28,39),(39,37),(41,40),(31,44),(22,39)],fill='#b39c7c');d.rectangle((30,35+bob,38,41+bob),fill='#5aa58e');d.rectangle((32,32+bob,35,35+bob),fill='#b8d0ae');d.rectangle((31,36+bob,32,39+bob),fill='#d9e3b4')
    else:
        d.line([(27,23+bob),(31,29+bob),(38,24+bob)],fill=hair,width=2);d.rectangle((26,19+bob,32,22+bob),outline='#9d895f');d.rectangle((34,19+bob,40,22+bob),outline='#9d895f')
        d.polygon([(21,36),(31,34),(35,37),(44,35),(43,45),(33,47),(21,43)],fill='#bca581');d.line([(33,37),(33,46)],fill='#60584c');d.line([(24,38),(29,37)],fill='#ead5a5')
    return im

def generate(out):
    out.mkdir(parents=True,exist_ok=True);landscape().save(out/'pixel-frontier.png',optimize=True)
    sheet=Image.new('RGBA',(192,64))
    for i in range(3):sheet.paste(prop(i),(i*64,0))
    sheet.save(out/'pixel-destructibles.png',optimize=True)
    npcs=Image.new('RGBA',(256,128))
    for kind in range(2):
        for frame in range(4):npcs.paste(resident(kind,frame),(frame*64,kind*64))
    npcs.save(out/'pixel-residents.png',optimize=True)
    original=Image.open(out/'pixel-weapons.png').convert('RGBA');weapons=Image.new('RGBA',(384,384));weapons.paste(original,(0,0));weapons.paste(shield(),(0,320));weapons.paste(shield(True),(64,320));weapons.save(out/'pixel-weapons.png',optimize=True)
    weapons.resize((768,768),Image.Resampling.NEAREST).save(out/'pixel-weapons-preview.png',optimize=True)
    original=Image.open(out/'pixel-npc-glyphs.png').convert('RGBA');glyphs=Image.new('RGBA',(384,32));glyphs.paste(original,(0,0))
    for i in range(4):
        im=Image.new('RGBA',(32,32));d=ImageDraw.Draw(im);d.polygon([(9,3),(23,3),(29,10),(29,23),(22,29),(9,29),(3,23),(3,10)],fill='#25323b',outline='#86785b')
        if i==0:
            d.line([(13,24),(18,9)],fill='#b9d6a1',width=2);d.polygon([(16,13),(9,9),(9,15),(15,17)],fill='#87b88d');d.polygon([(16,18),(23,12),(24,19)],fill='#b5d6a0')
        elif i==1:
            d.polygon([(10,9),(22,9),(23,18),(16,25),(9,18)],fill='#a9c796');d.polygon([(13,12),(19,12),(19,18),(16,21),(13,18)],fill='#3c685b')
        elif i==2:
            d.polygon([(7,9),(15,8),(17,11),(25,9),(25,23),(17,25),(14,22),(7,23)],fill='#ccb9d4');d.line([(16,11),(16,23)],fill='#655675');d.line([(9,13),(13,13)],fill='#6f6485')
        else:
            d.arc((7,7,25,25),30,320,fill='#dfbf87',width=2);d.polygon([(16,9),(20,16),(16,22),(12,16)],fill='#d6dfb3');d.rectangle((15,13,16,17),fill='#fcf0c6')
        glyphs.paste(im,((i+8)*32,0))
    glyphs.save(out/'pixel-npc-glyphs.png',optimize=True)
    print('Frontier art: map, three props, two NPC sprite rows, shield icons and four runes')

if __name__=='__main__':generate(ROOT/'public'/'art')
