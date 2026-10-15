#!/usr/bin/env python3
"""Original 640×420 camp pixel art, authored directly with Pillow; no scaling."""
from pathlib import Path
import math, random
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]

def camp_map():
    rng=random.Random(1037)
    im=Image.new('RGB',(640,420),'#101d28');d=ImageDraw.Draw(im)
    def box(b,c):d.rectangle(b,fill=c)
    def line(p,c,w=1):d.line(p,fill=c,width=w)
    def poly(p,c):d.polygon(p,fill=c)
    def ellipse(b,c):d.ellipse(b,fill=c)
    # Cool forest floor: clusters of leaves and lichen, with quiet walking space.
    for _ in range(3600):
        x=rng.randrange(640);y=rng.randrange(420)
        box((x,y,x+rng.randrange(1,7),y+rng.randrange(1,3)),rng.choice(['#172b34','#1b3037','#20383c','#152731']))
    ellipse((80,67,565,395),'#0a151f')
    ellipse((86,57,558,383),'#192932')
    # Raised terrace edge is made of separate dressed stones with visible faces.
    for a in range(0,360,4):
        t=math.radians(a);x=320+round(math.cos(t)*232);y=210+round(math.sin(t)*153)
        box((x-6,y-3,x+6,y+9),'#253740')
        line([(x-5,y-2),(x+5,y-2)],'#687679')
        line([(x+6,y),(x+6,y+8)],'#142732')
    ellipse((96,56,545,358),'#263a42')
    paving=Image.new('RGB',im.size,'#24363e');pd=ImageDraw.Draw(paving)
    mask=Image.new('L',im.size);ImageDraw.Draw(mask).ellipse((99,58,542,356),fill=255)
    for row,y in enumerate(range(58,362,17)):
        for x in range(83-(row%2)*15,557,31):
            tone=rng.choice(['#394b50','#3c4e51','#35494e','#405054','#3a4a50'])
            pd.polygon([(x+2,y+2),(x+28,y+1),(x+29,y+14),(x+1,y+15)],fill=tone)
            pd.line([(x+3,y+2),(x+27,y+2)],fill='#58686a')
            pd.line([(x+29,y+3),(x+29,y+14),(x+3,y+15)],fill='#233740')
            if rng.random()<.5:
                px=x+rng.randrange(7,20);pd.line([(px,y+3),(px-2,y+6),(px+2,y+8),(px+1,y+13)],fill='#2a3e46')
                pd.point((px-1,y+6),fill='#64716d')
            for _ in range(3):
                px=x+rng.randrange(4,25);py=y+rng.randrange(4,12)
                pd.line([(px,py),(px+2,py)],fill=rng.choice(['#44595a','#30454b','#4b5c5c']))
            if rng.random()<.2:pd.line([(x+3,y+14),(x+7,y+13),(x+9,y+14)],fill='#586955',width=1)
    im.paste(paving,(0,0),mask);d=ImageDraw.Draw(im)
    # Deliberate moss clusters weave around the edge, rather than uniform noise.
    for _ in range(380):
        t=rng.random()*math.tau;r=rng.uniform(.92,1.07)
        x=320+round(math.cos(t)*224*r);y=207+round(math.sin(t)*150*r)
        for j in range(rng.randrange(2,5)):
            xx=x+rng.randrange(-5,6);yy=y+rng.randrange(-3,4)
            box((xx,yy,xx+2,yy+1),rng.choice(['#536754','#415b4d','#6b785c','#344b44']))
            if j==0:line([(xx,yy),(xx-1,yy-4)],'#82906d')
    # Stone steps and arrival mosaic.
    for i in range(5):
        x=293-i*7;y=356+i*7
        box((x,y,347+i*7,y+6),'#293d45');box((x+1,y,346+i*7,y+3),'#536269')
        line([(x+2,y),(345+i*7,y)],'#8a958b');line([(319,y+1),(319,y+3)],'#354951')
    for r,c in [(31,'#263a42'),(29,'#61796e'),(25,'#344c4b')]:ellipse((320-r,303-r//3,320+r,303+r//3),c)
    line([(295,303),(320,294),(345,303),(320,312),(295,303)],'#b3b29a')
    line([(307,303),(320,298),(333,303),(320,308),(307,303)],'#728f7f')
    # Moon gate dais, cut blocks, concentric inlays and engraved lunar runes.
    for b,c in [((246,131,394,249),'#142632'),((249,129,391,243),'#6c7a81'),((253,130,387,238),'#314855'),((257,134,383,234),'#62717a'),((261,137,379,230),'#2d4454')]:ellipse(b,c)
    d.ellipse((271,143,369,225),outline='#889398',width=1)
    d.ellipse((281,149,359,219),outline='#586e80',width=2)
    for i in range(20):
        a=i*math.tau/20;x=320+round(math.cos(a)*65);y=184+round(math.sin(a)*50)
        line([(x-2,y-1),(x+1,y+2),(x+2,y)],'#a2a1b2')
        if i%3==0:line([(x,y+3),(x+1,y+5)],'#6e8494')
    for x,y in [(320,134),(384,184),(320,237),(255,184)]:
        poly([(x,y-5),(x+5,y),(x,y+5),(x-5,y)],'#a6a1af')
        poly([(x,y-2),(x+2,y),(x,y+2),(x-2,y)],'#e0d6d2')
    # Shelter: folded canvas, gold stitch, rope and wooden pegs.
    ellipse((74,193,157,224),'#182930')
    poly([(80,209),(109,163),(149,210)],'#101d27')
    poly([(84,206),(109,168),(144,207)],'#4d635e')
    poly([(110,171),(135,206),(102,206)],'#192d34')
    poly([(87,203),(108,173),(102,196),(100,204)],'#718278')
    line([(86,205),(109,170),(143,207)],'#a8ab89',2)
    line([(91,190),(99,193),(97,202)],'#88977e')
    line([(109,168),(70,213)],'#8d8668');line([(110,168),(157,214)],'#8d8668')
    for x in [70,157]:line([(x,211),(x+1,217)],'#b39f73',2)
    def crate(x,y):
        poly([(x,y),(x+12,y-3),(x+17,y+1),(x+5,y+4)],'#8b7b5c')
        box((x,y+4,x+14,y+15),'#4b5045');box((x+2,y+5,x+12,y+12),'#68674f')
        line([(x+3,y+5),(x+11,y+12)],'#a28c60',2);line([(x+4,y+3),(x+4,y+13)],'#3e453c')
    crate(83,220);crate(103,224)
    # Keeper rug: fringed woven cloth and a low fire basin with glowing coals.
    ellipse((152,234,230,276),'#192b32')
    poly([(157,240),(184,231),(205,254),(168,267)],'#585263')
    line([(159,241),(183,234),(201,253),(169,263),(159,241)],'#9c8e7b')
    line([(164,243),(182,239),(195,252),(171,258),(164,243)],'#716775')
    for i in range(7):line([(167+i*4,265-i),(168+i*4,269-i)],'#a5987b')
    for x,y in [(217,251),(225,256),(212,263)]:
        box((x-4,y-3,x+5,y+2),'#655d56');line([(x-3,y-2),(x+4,y-2)],'#bdb29a');line([(x-2,y),(x+3,y)],'#c5bda7')
    ellipse((196,243,221,254),'#19252b');ellipse((198,238,219,249),'#9a805d')
    ellipse((199,238,218,245),'#4b3936');line([(198,240),(201,247),(216,247),(219,240)],'#bf9c67',2)
    for x,y in [(203,242),(207,241),(213,243)]:box((x,y,x+2,y+1),'#df8c55')
    for x in [201,215]:line([(x,247),(x-1,253)],'#685c4d',2)
    # East forge with anvils, tools, charcoal, timber and a cold masonry furnace.
    ellipse((442,237,508,282),'#172a31')
    poly([(475,212),(496,209),(505,220),(505,246),(475,249)],'#243740')
    box((478,217,501,243),'#4c595d');line([(479,216),(496,213),(503,221)],'#818984',2)
    box((483,225,497,242),'#172831');d.arc((483,218,497,233),180,360,fill='#7a8278',width=2)
    for yy in [221,231,240]:line([(479,yy),(482,yy)],'#253943');line([(499,yy),(503,yy)],'#253943')
    box((452,248,475,262),'#4d4b42');line([(454,250),(472,250)],'#8e8061')
    poly([(447,242),(471,239),(487,242),(477,249),(463,249),(462,255),(450,255)],'#263b45')
    poly([(448,241),(469,238),(486,241),(477,245),(451,246)],'#738284')
    line([(450,241),(470,239),(482,241)],'#acb6a6');line([(464,244),(464,248)],'#a4afa1')
    for x,y in [(491,260),(496,265),(489,270)]:
        box((x,y,x+18,y+4),'#534b40');line([(x+2,y),(x+17,y)],'#89795c');ellipse((x-2,y,x+3,y+4),'#ba9a69')
    line([(439,259),(449,270)],'#92785d',2);box((437,257,442,260),'#a0aaa0')
    # Herb garden, irregular stone border, distinct leaf and flower silhouettes.
    poly([(151,120),(186,114),(203,139),(167,149)],'#182a2e')
    poly([(156,122),(185,118),(198,138),(168,145)],'#3f5144')
    for x,y in [(157,121),(170,118),(185,117),(197,135),(181,144),(168,147)]:
        poly([(x-3,y-1),(x+3,y-2),(x+5,y+2),(x-2,y+3)],'#6d776c');line([(x-2,y-1),(x+2,y-1)],'#a5a68a')
    for x,y in [(166,129),(177,126),(189,134),(176,138)]:
        line([(x,y+5),(x,y-2)],'#8b9e76');poly([(x,y),(x-5,y-3),(x-4,y+1)],'#6a8a65');poly([(x,y+2),(x+5,y-1),(x+4,y+3)],'#a0ad7d')
        box((x-1,y-3,x+1,y-1),'#d4c3af');box((x,y-4,x,y-3),'#e9dfba')
    # Archive table: perspective legs, open pages, leather books and empty stool.
    ellipse((450,125,505,151),'#1b2c33')
    for x,y in [(456,133),(484,129)]:box((x,y,x+3,y+14),'#344a51');line([(x,y),(x,y+12)],'#7a8580')
    poly([(450,120),(481,115),(496,128),(465,136)],'#253e47')
    poly([(451,118),(481,113),(496,126),(466,133)],'#6d7c7c');line([(452,118),(481,114),(493,125)],'#afb2a2')
    poly([(461,119),(470,117),(475,121),(482,119),(488,124),(476,127)],'#b6a78c')
    line([(475,121),(476,126)],'#6d6e63');line([(463,120),(470,119)],'#d4c6a4');line([(478,123),(484,123)],'#6c766d')
    box((501,134,513,144),'#4a6062');line([(501,134),(511,134)],'#91a198');box((502,144,504,150),'#273d47')
    # Lantern plinths and hanging brass cages. Flame is animated in the renderer.
    for x,y in [(124,110),(518,112),(130,314),(516,314)]:
        poly([(x-6,y+11),(x+5,y+10),(x+21,y+30),(x+5,y+32)],'#142731')
        box((x-5,y-9,x+5,y+15),'#3e555d');line([(x-4,y-8),(x-4,y+13)],'#89948a')
        for yy in [y-2,y+7]:line([(x-3,yy),(x+4,yy)],'#233c48')
        box((x-7,y-12,x+7,y-8),'#74857f');line([(x-6,y-12),(x+6,y-12)],'#a4ab94')
        box((x-4,y-24,x+4,y-13),'#453f35');box((x-2,y-22,x+2,y-15),'#d3a16b')
        line([(x-4,y-24),(x,y-27),(x+4,y-24)],'#b39465');line([(x,y-24),(x,y-14)],'#6b5942')
    # Layered trees with bark, directional cast shadows and leaf clusters.
    def tree(x,y,seed):
        rr=random.Random(seed)
        poly([(x-14,y+14),(x+10,y+10),(x+41,y+42),(x+14,y+48)],'#0b1923')
        poly([(x-5,y-3),(x-7,y+23),(x+4,y+25),(x+6,y-8)],'#24393d')
        line([(x-2,y+18),(x-1,y-2)],'#657164',2);line([(x+2,y+7),(x+3,y+20)],'#172c33',2)
        for dx,dy,r in [(-13,-3,22),(15,-6,23),(0,-29,24),(-10,-30,17),(11,-38,19)]:
            xx=x+dx;yy=y+dy
            poly([(xx,yy-r),(xx+r-2,yy-r//3),(xx+r,yy+r//3),(xx+4,yy+r),(xx-r,yy+7),(xx-r,yy-r//3)],'#142c36')
            poly([(xx,yy-r+3),(xx+r-5,yy-r//3),(xx+4,yy+3),(xx-r+4,yy-r//3)],'#29474c')
            line([(xx-r//2,yy-r//2),(xx,yy-r+4),(xx+r//2,yy-r//2)],'#426560',2)
            for _ in range(19):
                ax=xx+rr.randrange(-r//2,r//2+1);ay=yy+rr.randrange(-r//2,r//2+1)
                line([(ax,ay),(ax+rr.randrange(2,5),ay)],rr.choice(['#36574f','#527461','#3d6259','#203c43']))
    positions=[(55,88),(110,51),(188,40),(263,34),(376,34),(462,42),(541,58),(592,92),(32,169),(49,274),(77,350),(152,388),(225,407),(409,404),(502,384),(581,349),(611,274),(610,180)]
    for i,(x,y) in enumerate(positions):tree(x,y,92+i)
    return im

def generate(out):
    out.mkdir(parents=True,exist_ok=True)
    image=camp_map();image.save(out/'pixel-camp.png',optimize=True)
    print(f'Camp: {image.width}×{image.height} native pixels')

if __name__=='__main__':generate(ROOT/'public'/'art')
