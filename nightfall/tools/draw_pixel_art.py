#!/usr/bin/env python3
"""Draw NIGHTFALL's original pixel assets. Requires Pillow. No source images.
Usage: python tools/draw_pixel_art.py [--out public/art]
Every mark is drawn on a native pixel grid; no antialiasing or image-model input.
"""
from pathlib import Path
import argparse, math, random
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
P = {
 'outline':'#101b21','dark':'#192a30','shade':'#253b40','slate':'#354c50',
 'stone':'#435b5c','light':'#5b7470','moss':'#344b3b','grass':'#506443',
 'sage':'#899c6e','mint':'#b8cba0','white':'#edf0d3','gold':'#c9ad6e',
 'gold_dark':'#806646','teal':'#69b3a4','cyan':'#a9ded0','red':'#b7636a',
 'bone':'#c5c5a0','bone_dark':'#8d937d','ink':'#0b151b',
}
def new(): return Image.new('RGBA',(64,64),(0,0,0,0))
def line(d,pts,c,w=1): d.line(pts,fill=c,width=w)
def rect(d,b,c): d.rectangle(b,fill=c)
def poly(d,pts,c,outline=None): d.polygon(pts,fill=c,outline=outline)
def diamond(d,x,y,r,c):poly(d,[(x,y-r),(x+r,y),(x,y+r),(x-r,y)],c)
def star(d,x,y,c):line(d,[(x-2,y),(x+2,y)],c);line(d,[(x,y-2),(x,y+2)],c)

def hero(frame=0):
 im=new();d=ImageDraw.Draw(im);o=P['outline'];a=(0,1,0,-1)[frame];b=(0,-1,0,1)[frame]
 # Swept hooded cape, separated dark outline and folded moonlit cloth.
 poly(d,[(25,19),(16,24),(15,33),(9,41),(12,43),(7,48),(17,48),(21,44),(27,48),(35,45),(40,33),(37,22)],o)
 poly(d,[(25,22),(18,27),(18,34),(12,43),(17,43),(13,46),(21,44),(25,45),(30,40),(35,39),(37,29),(34,23)],'#2a514d')
 poly(d,[(20,29),(18,40),(15,43),(21,41),(25,34),(25,25)],'#3b6c60')
 line(d,[(17,38),(22,34),(24,27)],'#548c70');line(d,[(28,26),(31,35),(28,42)],'#1e373b',2)
 # Boots and trouser folds; four small walking variations.
 poly(d,[(26,39),(32,40),(31,49+a),(26,54+a),(20,54+a),(20,51+a),(25,47+a)],o)
 poly(d,[(32,39),(38,38),(40,47+b),(37,54+b),(31,54+b),(30,51+b),(34,46+b)],o)
 rect(d,(26,41,30,47+a),'#3e4f50');rect(d,(34,40,37,47+b),'#576260')
 line(d,[(25,49+a),(29,49+a)],P['gold_dark']);line(d,[(33,50+b),(37,50+b)],P['gold_dark'])
 rect(d,(21,52+a,27,53+a),'#53605c');rect(d,(31,52+b,36,53+b),'#53605c')
 # Tunic and layered armor.
 poly(d,[(25,23),(35,23),(40,30),(37,41),(29,43),(23,38),(23,29)],o)
 poly(d,[(27,25),(35,25),(38,30),(35,40),(29,40),(25,36),(25,29)],'#485957')
 rect(d,(27,29,34,34),'#657267');line(d,[(27,29),(34,28),(36,32)],'#8a9680')
 line(d,[(25,37),(36,38)],'#b6975e',2);rect(d,(30,36,32,39),P['gold'])
 line(d,[(29,24),(31,31)],P['gold_dark']);line(d,[(25,31),(27,35)],'#263a3b',2)
 # Arms and gloves.
 poly(d,[(24,26),(20,28),(20,34),(23,36),(26,33),(27,28)],o)
 poly(d,[(23,28),(21,30),(22,33),(24,33),(25,29)],'#718273')
 poly(d,[(36,27),(40,28),(43,35),(42,39),(38,38),(35,32)],o)
 rect(d,(39,34,42,38),P['gold_dark']);rect(d,(40,35,42,36),P['gold'])
 # Face, white hair and green hood.
 poly(d,[(24,11),(30,7),(37,10),(41,18),(38,25),(28,27),(22,22),(21,16)],o)
 poly(d,[(25,12),(30,9),(36,11),(39,18),(36,23),(27,24),(24,20),(23,16)],'#466357')
 poly(d,[(29,15),(36,15),(38,18),(36,23),(31,23),(28,20)],'#d5bea0')
 rect(d,(32,18,34,19),o);rect(d,(35,18,36,18),P['white'])
 poly(d,[(24,16),(27,12),(34,11),(36,14),(32,15),(30,20),(27,22),(27,18),(23,20)],'#c7d2bf')
 line(d,[(26,15),(28,13),(32,12)],P['white']);line(d,[(25,21),(22,24),(19,24)],'#bdcab7')
 line(d,[(27,10),(31,8),(37,12)],'#8d9c7e');line(d,[(37,12),(40,19)],P['gold_dark'])
 # Crescent blade: outlined ivory edge and golden handguard.
 poly(d,[(44,30),(49,33),(49,42),(45,49),(39,52),(31,51),(28,47),(34,49),(39,48),(43,44),(45,39),(44,34)],o)
 poly(d,[(46,33),(48,35),(47,42),(44,47),(39,50),(33,50),(30,48),(36,49),(41,46),(44,41)],'#c6cfb5')
 line(d,[(47,35),(47,41),(43,46),(39,48),(34,49)],P['white'])
 diamond(d,43,33,4,P['gold_dark']);diamond(d,43,33,2,P['gold']);rect(d,(43,32,44,33),P['white'])
 rect(d,(41,28,42,31),P['gold_dark']);star(d,50,29,P['mint'])
 return im

def skeleton():
 im=new();d=ImageDraw.Draw(im);o=P['outline'];bone=P['bone'];sh=P['bone_dark']
 # Ragged charcoal tunic, open rib cage, bony limbs.
 poly(d,[(23,24),(19,28),(19,36),(25,43),(28,38),(31,43),(34,38),(39,42),(41,32),(37,24)],o)
 poly(d,[(22,29),(24,35),(22,39),(27,37),(30,40),(35,36),(38,39),(39,29)],'#35413f')
 line(d,[(22,27),(17,33),(15,42),(12,43)],o,4);line(d,[(22,27),(18,33),(16,41),(13,42)],sh,2)
 line(d,[(38,27),(44,33),(45,41),(49,44)],o,4);line(d,[(38,27),(43,33),(44,40),(48,43)],bone,2)
 rect(d,(12,42,15,45),sh);rect(d,(47,43,50,46),sh)
 line(d,[(28,39),(25,46),(26,52),(22,54)],o,5);line(d,[(35,39),(38,46),(36,54),(40,54)],o,5)
 line(d,[(28,40),(26,46),(27,52),(23,53)],bone,2);line(d,[(35,40),(37,46),(35,53),(40,53)],sh,2)
 rect(d,(26,26,36,29),sh);line(d,[(31,26),(31,37)],bone,2)
 for y in [29,32,35]:line(d,[(26,y),(28,y+1),(34,y+1),(37,y)],bone)
 poly(d,[(24,12),(29,9),(36,11),(40,16),(39,23),(35,27),(27,26),(23,21)],o)
 poly(d,[(25,14),(29,11),(35,12),(38,16),(37,22),(34,25),(27,24),(25,20)],bone)
 rect(d,(26,14,29,15),P['white']);rect(d,(34,13,36,15),'#d7d8b8')
 rect(d,(26,17,30,20),o);rect(d,(34,17,37,20),o);rect(d,(31,21,32,22),o)
 line(d,[(28,23),(35,23)],sh);rect(d,(29,23,29,25),o);rect(d,(33,23,33,25),o)
 return im

def ghost():
 im=new();d=ImageDraw.Draw(im);o=P['outline']
 # Discrete nested silhouettes replace blurred glow.
 poly(d,[(28,6),(37,9),(43,17),(43,26),(49,32),(46,39),(42,36),(44,45),(38,48),(36,57),(30,54),(26,58),(24,50),(18,47),(21,37),(15,40),(13,35),(20,27),(22,16)],'#1a4547')
 poly(d,[(29,10),(35,11),(40,18),(40,28),(44,33),(41,40),(39,37),(39,45),(34,50),(32,54),(28,49),(25,51),(24,44),(27,34),(20,36),(17,37),(23,28),(25,19)],'#397871')
 poly(d,[(29,12),(35,14),(38,20),(37,29),(33,34),(37,40),(32,47),(28,49),(30,40),(26,35),(28,27)],'#63a695')
 poly(d,[(29,17),(35,17),(38,22),(35,28),(28,29),(25,25)],o)
 rect(d,(28,22,30,24),P['cyan']);rect(d,(34,21,36,23),P['cyan'])
 rect(d,(28,22,29,23),P['white']);rect(d,(34,21,35,22),P['white'])
 line(d,[(27,16),(30,12),(35,14)],'#a0c8ac');line(d,[(26,30),(24,36),(22,40)],'#8bc4ac')
 line(d,[(33,37),(35,42),(31,49)],'#94c8ad');rect(d,(19,18,20,20),'#588e78');rect(d,(44,21,45,23),'#588e78')
 return im

def bat():
 im=new();d=ImageDraw.Draw(im);o=P['outline']
 pts=[(29,26),(23,21),(15,16),(7,13),(8,20),(5,27),(9,26),(10,33),(14,30),(18,38),(22,34),(28,37),(36,37),(42,34),(46,38),(50,30),(54,33),(55,26),(59,27),(56,20),(57,13),(49,16),(41,21),(35,26)]
 poly(d,pts,o)
 poly(d,[(27,27),(20,23),(10,17),(12,24),(9,26),(12,29),(15,27),(18,34),(22,30),(28,33)],'#563c50')
 poly(d,[(37,27),(44,23),(54,17),(52,24),(55,26),(52,29),(49,27),(46,34),(42,30),(36,33)],'#563c50')
 line(d,[(11,18),(20,25),(23,30)],'#8b5b67');line(d,[(53,18),(44,25),(41,30)],'#8b5b67')
 poly(d,[(27,21),(30,26),(34,26),(37,21),(38,33),(35,40),(29,40),(26,33)],o)
 poly(d,[(29,27),(35,27),(36,33),(33,38),(30,38),(28,33)],'#64525e')
 rect(d,(29,29,30,30),'#e09a83');rect(d,(34,29,35,30),'#e09a83');rect(d,(30,34,30,35),P['bone']);rect(d,(34,34,34,35),P['bone'])
 return im

def boss():
 im=new();d=ImageDraw.Draw(im);o=P['outline']
 # Antlers, bark mantle, bone skull and an exposed spectral core.
 for pts in [[(27,22),(20,16),(15,7),(11,5)],[(21,17),(10,14),(6,8)],[(17,10),(20,4)],[(37,22),(44,16),(49,7),(53,5)],[(43,17),(54,14),(58,8)],[(47,10),(44,4)]]:
  line(d,pts,o,4);line(d,pts,'#77816a',2)
 poly(d,[(25,22),(18,24),(10,33),(15,40),(12,47),(22,45),(22,54),(28,52),(31,59),(35,53),(42,56),(42,45),(51,48),(48,39),(54,34),(44,25),(38,22)],o)
 poly(d,[(23,26),(17,28),(15,36),(19,40),(16,44),(25,42),(25,50),(30,48),(32,55),(35,48),(39,51),(38,41),(47,44),(44,37),(49,34),(42,28),(37,26)],'#334e43')
 line(d,[(21,30),(18,36),(23,42),(24,48)],'#66745b',2);line(d,[(42,29),(43,35),(39,43),(40,48)],'#6e7b61',2)
 line(d,[(16,31),(21,29),(24,32)],'#8b8d6a');line(d,[(43,31),(47,33)],'#8b8d6a')
 poly(d,[(25,28),(30,25),(38,28),(40,38),(36,46),(30,47),(25,40),(23,34)],o)
 poly(d,[(29,29),(35,29),(37,35),(35,42),(31,44),(27,39),(26,34)],'#2c6960')
 diamond(d,32,36,5,'#529c86');diamond(d,32,35,3,P['cyan']);rect(d,(31,32,32,36),P['white'])
 line(d,[(26,31),(27,41),(31,45)],'#8b9980');line(d,[(37,31),(37,40),(34,45)],'#8b9980')
 poly(d,[(25,16),(29,13),(36,14),(40,18),(38,25),(35,30),(28,28),(24,22)],o)
 poly(d,[(27,17),(30,15),(35,16),(37,19),(36,24),(33,28),(29,26),(26,21)],P['bone'])
 rect(d,(27,19,30,22),o);rect(d,(34,19,37,22),o);rect(d,(28,20,29,21),P['teal']);rect(d,(34,20,35,21),P['teal']);rect(d,(31,24,33,25),P['bone_dark'])
 line(d,[(24,26),(20,30),(21,34)],'#a1a689',2);line(d,[(39,26),(43,29),(42,33)],'#a1a689',2)
 return im

def crystal():
 im=new();d=ImageDraw.Draw(im)
 poly(d,[(32,11),(42,31),(32,49),(22,31)],'#234e49')
 poly(d,[(32,14),(39,31),(32,45),(25,31)],'#71bc9a')
 poly(d,[(32,14),(32,45),(25,31)],'#bbdfb3')
 poly(d,[(32,15),(37,29),(32,27)],P['white'])
 line(d,[(25,31),(32,34),(39,31)],'#3e8879')
 diamond(d,18,38,5,'#80b497');diamond(d,45,43,4,'#80b497');star(d,46,20,P['mint'])
 return im

def blade():
 im=new();d=ImageDraw.Draw(im);o=P['outline']
 poly(d,[(38,9),(46,17),(49,27),(46,39),(38,49),(25,53),(15,48),(22,49),(34,44),(40,36),(42,26),(40,16)],o)
 poly(d,[(40,13),(45,19),(47,28),(44,39),(36,47),(25,51),(18,49),(29,47),(38,40),(42,31),(43,22)],'#b3c8ab')
 line(d,[(42,16),(45,23),(45,32),(41,40),(35,46),(26,49)],P['white'],2)
 poly(d,[(30,25),(37,22),(42,29),(38,36),(31,34),(27,29)],P['gold_dark'])
 diamond(d,35,29,5,P['gold']);diamond(d,35,29,2,P['white']);line(d,[(29,33),(24,39)],P['gold_dark'],3)
 star(d,21,18,P['mint']);return im

def heart():
 im=new();d=ImageDraw.Draw(im)
 pts=[(19,20),(25,17),(31,21),(33,21),(39,17),(45,20),(47,27),(44,34),(32,46),(20,34),(17,27)]
 poly(d,pts,P['outline']);poly(d,[(20,22),(25,20),(31,24),(33,24),(39,20),(44,22),(44,29),(40,35),(32,42),(23,34),(20,29)],'#8b3c51')
 poly(d,[(23,23),(26,22),(31,26),(35,24),(39,23),(40,28),(35,33),(30,38),(23,29)],'#c66c77')
 rect(d,(24,23,26,25),'#ebaba0');line(d,[(32,39),(41,31)],'#d69083');star(d,49,17,P['gold'])
 return im

def arena():
 rnd=random.Random(701);im=Image.new('RGB',(480,320),P['ink']);d=ImageDraw.Draw(im)
 # Dense, quiet forest floor. Pixel clusters, not noise or a filtered photo.
 for y in range(0,320,4):
  for x in range(0,480,4):
   r=rnd.random();c=['#172b2c','#1c3331','#233c35','#294238'][min(3,int(r*4))]
   rect(d,(x,y,x+3,y+3),c)
 for _ in range(2200):
  x=rnd.randrange(480);y=rnd.randrange(320)
  rect(d,(x,y,x+rnd.randrange(1,4),y+1),rnd.choice(['#2f493a','#39513d','#1a2c2c']))
 # Rounded courtyard paved with individually shaded offset flagstones.
 mask=Image.new('1',(480,320));md=ImageDraw.Draw(mask);md.ellipse((49,32,431,291),fill=1)
 paving=Image.new('RGB',(480,320),P['dark']);pd=ImageDraw.Draw(paving)
 for row,y in enumerate(range(28,300,10)):
  for x in range(40-(row%2)*9,440,19):
   c=rnd.choice(['#334c50','#364f51','#3b5355','#30494d','#3a5050'])
   rect(pd,(x+1,y+1,x+17,y+8),c)
   line(pd,[(x+2,y+1),(x+16,y+1)],'#536967')
   line(pd,[(x+1,y+7),(x+17,y+7)],'#293e43')
   if rnd.random()<.32:line(pd,[(x+7,y+2),(x+9,y+4),(x+8,y+6)],'#263b40')
   if rnd.random()<.3:rect(pd,(x+2,y+6,x+5,y+7),'#4b614a')
 im.paste(paving,(0,0),mask);d=ImageDraw.Draw(im)
 # Inlaid moon rings and a restrained mosaic compass.
 for box in [(52,35,428,288),(75,51,405,273),(148,98,332,226)]:
  d.ellipse(box,outline='#253c40',width=4);d.ellipse(tuple(v+(1 if i<2 else -1) for i,v in enumerate(box)),outline='#61766b',width=1)
 for a in range(0,360,15):
  t=math.radians(a);x=240+int(math.cos(t)*177);y=162+int(math.sin(t)*117)
  line(d,[(x-2,y),(x+2,y)],'#9a9d75')
 d.ellipse((210,142,270,182),fill='#344e4d',outline='#738373',width=2)
 d.ellipse((221,149,259,176),outline='#a2a182',width=1)
 poly(d,[(240,136),(246,157),(274,162),(246,167),(240,188),(234,167),(206,162),(234,157)],'#6b7e6b')
 poly(d,[(240,144),(242,161),(260,162),(242,164),(240,180),(238,164),(220,162),(238,161)],'#a0a082')
 # Grass and flowers favor the edge; center remains legible for combat.
 for _ in range(190):
  a=rnd.random()*math.tau;r=rnd.uniform(.86,1.12);x=240+int(math.cos(a)*187*r);y=162+int(math.sin(a)*127*r)
  for _ in range(rnd.randrange(2,5)):
   xx=x+rnd.randrange(-4,5);yy=y+rnd.randrange(-3,4);line(d,[(xx,yy),(xx-1,yy-3)],'#708359')
  if rnd.random()<.5:rect(d,(x,y-3,x+1,y-2),rnd.choice(['#acb29b','#8ea9a5','#c8c6a0']))
 def tree(x,y,s=1):
  shadow=(x-20*s,y-8*s,x+20*s,y+11*s);d.ellipse(shadow,fill='#0e2228')
  poly(d,[(x-3*s,y),(x-5*s,y+19*s),(x+3*s,y+20*s),(x+4*s,y-7*s)],'#222f2c')
  line(d,[(x,y+15*s),(x-1*s,y-3*s)],'#5e6550',2*s)
  for dx,dy,r in [(-9,-16,14),(9,-16,15),(0,-30,16),(-13,-27,11),(13,-29,11),(0,-14,14)]:
   xx=x+dx*s;yy=y+dy*s;rr=r*s
   poly(d,[(xx,yy-rr),(xx+rr,yy-rr//3),(xx+rr+2,yy+rr//3),(xx+rr//2,yy+rr),(xx-rr//2,yy+rr),(xx-rr,yy+rr//4),(xx-rr,yy-rr//3)],'#172f30')
   poly(d,[(xx,yy-rr+2),(xx+rr-3,yy-rr//3),(xx+rr//2,yy+2),(xx-rr+3,yy-rr//4)],'#2c4940')
   line(d,[(xx-rr//2,yy-rr//2),(xx,yy-rr+3),(xx+rr//2,yy-rr//2)],'#45614b',s)
   for _ in range(9):
    px=xx+rnd.randrange(-rr//2,rr//2+1);py=yy+rnd.randrange(-rr//2,rr//2+1)
    rect(d,(px,py,px+s,py),rnd.choice(['#3b5743','#546748','#254036']))
 # Layered ruin arches at the outer wall.
 def ruin(x,y):
  d.ellipse((x-16,y+24,x+25,y+33),fill='#11262a')
  for xx in [x-13,x+14]:
   rect(d,(xx,y,xx+9,y+27),'#233a40');rect(d,(xx+1,y,xx+7,y+25),'#496163');line(d,[(xx+1,y),(xx+1,y+25)],'#738178')
   for yy in range(y+5,y+26,7):line(d,[(xx+1,yy),(xx+8,yy)],'#273e44')
  for xx,yy in [(x-8,y-6),(x,y-10),(x+8,y-6)]:rect(d,(xx,yy,xx+9,yy+7),'#4e6463');line(d,[(xx,yy),(xx+8,yy)],'#819083')
  poly(d,[(x-6,y+22),(x-2,y+5),(x+5,y+3),(x+9,y+22)],'#1a3035')
  line(d,[(x-1,y+9),(x+3,y+5),(x+6,y+11)],'#738477')
 for pos in [(94,24),(233,5),(383,25),(37,149),(417,159),(128,269),(349,272)]:ruin(*pos)
 for x,y in [(18,34),(47,61),(7,116),(18,188),(29,259),(8,324),(70,324),(462,38),(432,65),(475,117),(462,210),(448,273),(477,332),(166,8),(320,10),(227,331)]:tree(x,y,1)
 # Small candles use stepped amber lighting and bright two-pixel flames.
 for x,y in [(110,67),(370,67),(62,191),(417,208),(159,270),(333,268)]:
  for off,c in [(7,'#3c4939'),(5,'#5d6040'),(3,'#8b7851')]:d.ellipse((x-off,y-off,x+off,y+off),fill=c)
  rect(d,(x-2,y-1,x+2,y+3),'#444b3c');rect(d,(x,y-4,x+1,y),P['bone']);rect(d,(x,y-7,x+1,y-5),'#e9c982');rect(d,(x,y-6,x,y-5),'#fff0c1')
 return im

def relic(kind):
 im=new();d=ImageDraw.Draw(im)
 if kind==0:
  # Eclipsed moon, ivory cutting edge and a black-gold core.
  im=blade();d=ImageDraw.Draw(im)
  diamond(d,35,29,7,'#7b6547');diamond(d,35,29,5,'#e4c580');diamond(d,35,29,3,'#243b43')
  star(d,17,33,'#e4c580');star(d,50,19,'#e4c580')
 elif kind==1:
  for box,c in [((10,15,54,48),'#496452'),((11,16,53,47),'#bedab0'),((18,8,46,56),'#658f77')]:d.ellipse(box,outline=c,width=2)
  for x,y in [(15,22),(49,40),(33,10)]:diamond(d,x,y,4,'#d0e8b5');diamond(d,x,y,2,'#f0f3cf')
  diamond(d,32,32,8,'#4e8c78');diamond(d,32,32,5,'#a9d9b9');star(d,32,32,'#f0f3cf')
 elif kind==2:
  for angle in range(0,360,60):
   a=math.radians(angle);x=32+int(math.cos(a)*23);y=32+int(math.sin(a)*23)
   line(d,[(32,32),(x,y)],'#7faeba',2)
  diamond(d,32,32,16,'#314f65');diamond(d,32,32,12,'#82c5cb');diamond(d,32,32,7,'#d0eeee')
  poly(d,[(24,26),(28,23),(32,27),(36,23),(40,26),(39,32),(32,39),(25,32)],'#c0e9df')
  star(d,32,31,'#f5f6d8')
 elif kind==3:
  poly(d,[(33,6),(19,31),(29,34),(24,57),(47,28),(35,26),(42,6)],'#4b425d')
  poly(d,[(34,9),(23,29),(33,30),(29,48),(43,31),(32,29),(38,9)],'#b8a6df')
  line(d,[(33,15),(28,27),(36,29),(32,39)],'#f3dfb3',2)
  star(d,15,17,'#d7c5ec');star(d,49,48,'#d7c5ec')
 else:
  # A reusable chest; all silhouettes stay inside their cells.
  d.ellipse((12,45,53,53),fill='#152b29')
  poly(d,[(12,26),(18,18),(47,18),(53,26),(53,47),(12,47)],'#101b21')
  rect(d,(15,29,50,44),'#715947');rect(d,(17,32,48,42),'#8d704c')
  poly(d,[(15,26),(20,21),(45,21),(50,26),(50,31),(15,31)],'#a18a5c')
  line(d,[(16,26),(49,26)],'#d0b77a',2)
  for x in [18,44]:rect(d,(x,23,x+3,44),'#c7aa6d')
  rect(d,(29,28,36,36),'#dfc98c');rect(d,(32,30,33,33),'#394c40')
  star(d,32,11,'#eedb9f');rect(d,(10,20,11,21),'#d6c481')
 return im

def impact_frame(frame):
 # Five hand-drawn pixel stages: contact core, slash, sparks, and fragments.
 im=new();d=ImageDraw.Draw(im);center=32
 if frame<2:
  r=5+frame*3;diamond(d,center,center,r,'#e5c68b');diamond(d,center,center,r-2,'#fff4cc')
 if frame<4:
  reach=[14,23,25,23,0][frame]
  line(d,[(center-reach,center+reach//2),(center+reach,center-reach//2)],'#e8d4a1',3 if frame<2 else 1)
  line(d,[(center-reach//3,center-reach),(center+reach//3,center+reach)],'#fff4cc',2 if frame<2 else 1)
 for k in range(6):
  a=k*math.tau/6+.25;r=9+frame*4;x=center+round(math.cos(a)*r);y=center+round(math.sin(a)*r)
  size=2 if frame<3 else 1;rect(d,(x,y,x+size,y+size),'#fff4cc' if k%2==0 else '#c5ac7f')
 return im

def weapon_icon(kind):
 im=new();d=ImageDraw.Draw(im);o='#101b21'
 if kind==0:return blade()
 if kind==1:
  d.ellipse((10,13,54,51),outline='#618f82',width=3);d.ellipse((15,18,49,46),outline='#bcd8cf',width=2)
  for x,y in [(13,24),(49,39),(37,14)]:diamond(d,x,y,6,o);diamond(d,x,y,4,'#d0e6c7')
 elif kind==2:
  for a in range(0,360,60):
   t=math.radians(a);x=32+round(math.cos(t)*23);y=32+round(math.sin(t)*23);line(d,[(32,32),(x,y)],'#8eb7ca',3)
   line(d,[(x,y),(x-5,y-2)],'#c2e6e6',2)
  diamond(d,32,32,9,'#516f8b');diamond(d,32,32,5,'#d4edef')
 elif kind==3:return relic(3)
 elif kind==4:
  line(d,[(11,54),(48,17)],o,7);line(d,[(11,54),(46,19)],'#9d7d4d',3)
  poly(d,[(35,19),(53,7),(47,28),(44,21)],o);poly(d,[(38,19),(50,10),(46,24),(44,19)],'#dfd6b2');line(d,[(43,19),(50,10)],'#fff1c8',2)
  line(d,[(21,44),(25,47)],'#dfc381',4);star(d,31,13,'#dac588')
 elif kind==5:
  poly(d,[(25,12),(39,12),(39,24),(48,37),(47,49),(39,55),(24,55),(17,47),(18,36),(25,24)],o)
  poly(d,[(27,21),(37,21),(37,27),(45,38),(44,47),(38,52),(25,52),(20,46),(21,37),(27,27)],'#875c50')
  poly(d,[(22,38),(43,38),(43,47),(37,51),(26,51),(21,45)],'#dc8b5d');line(d,[(26,15),(38,15)],'#c3a073',5)
  poly(d,[(32,30),(27,40),(32,38),(33,47),(39,37),(35,38)],'#ffe0a0');line(d,[(23,32),(23,40)],'#f0c4a1',2)
 elif kind==6:
  line(d,[(17,52),(40,17)],o,8);line(d,[(18,51),(40,18)],'#957459',4)
  poly(d,[(32,14),(20,13),(9,22),(10,35),(23,39),(32,31),(36,28),(45,34),(56,27),(54,14),(44,9),(38,15)],o)
  poly(d,[(31,18),(20,17),(13,24),(14,32),(23,35),(31,28),(36,25),(45,30),(52,25),(50,17),(44,13),(38,19)],'#7e9e9b')
  line(d,[(14,25),(15,31),(23,34)],'#d5e2c8',2);line(d,[(45,14),(50,18),(52,24)],'#d5e2c8',2);diamond(d,35,23,4,'#d6bc80')
 elif kind==7:
  line(d,[(39,8),(46,15),(49,26),(47,38),(40,51),(34,56)],o,6)
  line(d,[(39,9),(44,16),(46,26),(44,38),(38,50),(34,54)],'#bdce95',3)
  line(d,[(39,9),(28,30),(34,54)],'#6d8d79');line(d,[(10,43),(49,19)],'#e3d5b0',2)
  poly(d,[(46,17),(54,15),(51,23)],'#d9e8bb');poly(d,[(11,41),(11,48),(17,43)],'#6f8e72')
 elif kind==8:
  line(d,[(17,55),(38,12)],o,7);line(d,[(18,54),(38,13)],'#836b8d',3)
  poly(d,[(36,10),(47,10),(56,17),(57,32),(51,43),(47,46),(50,32),(47,23),(39,21),(29,26),(21,34),(24,24)],o)
  poly(d,[(36,14),(46,14),(52,19),(54,31),(50,39),(51,28),(46,20),(38,18),(28,25),(24,29)],'#b5a8d0')
  line(d,[(36,14),(45,14),(51,20)],'#e4d9dd',2);diamond(d,35,19,3,'#dbc28f')
 elif kind==9:
  d.ellipse((9,9,55,55),outline='#9d688d',width=2);d.ellipse((15,15,49,49),outline='#e0b1c9',width=1)
  poly(d,[(32,14),(47,41),(17,41)],None,'#dcb3cb');poly(d,[(32,50),(17,23),(47,23)],None,'#dcb3cb');diamond(d,32,32,7,'#674a71');star(d,32,32,'#f4d6dc')
 elif kind==10:
  poly(d,[(29,25),(12,14),(4,15),(7,30),(19,39),(26,38),(20,51),(30,45),(36,45),(44,52),(40,35),(52,28),(59,16),(47,16),(36,24),(34,19)],o)
  poly(d,[(29,28),(13,18),(7,18),(11,29),(21,35),(29,34),(26,44),(33,39),(37,43),(36,32),(49,25),(54,19),(47,20),(36,29),(32,23)],'#596c9b')
  line(d,[(10,22),(20,31),(27,31)],'#9bafd2',2);line(d,[(39,29),(49,23)],'#b7c6e0',2);rect(d,(32,26,34,27),'#f1deaa');poly(d,[(35,27),(41,29),(35,30)],'#bba378')
 else:
  poly(d,[(32,6),(51,31),(32,58),(13,31)],o);poly(d,[(32,10),(47,31),(32,53),(17,31)],'#66a9ad')
  poly(d,[(32,10),(32,53),(17,31)],'#3e677e');poly(d,[(32,10),(47,31),(32,30)],'#b5e2d7')
  line(d,[(32,11),(32,50)],'#e4f4dc',2);star(d,10,12,'#b5d9c7');star(d,53,48,'#b5d9c7')
 return im

def union_icon(kind):
 base=[4,5,8,7,11,10][kind];im=weapon_icon(base);d=ImageDraw.Draw(im)
 colors=['#eed18a','#f2ac76','#cdb0e8','#d0c2f0','#a6dfeb','#d4cef3'];c=colors[kind]
 if kind==0:
  d.ellipse((4,5,32,33),outline=c,width=2);d.ellipse((10,7,33,28),fill=(0,0,0,0));star(d,29,32,c)
 elif kind==1:
  for x,y in [(12,12),(51,10),(54,45)]:line(d,[(x+5,y-6),(x,y)],c,2);diamond(d,x,y,3,'#f4ddb6')
 elif kind==2:
  d.arc((6,7,56,57),35,270,fill=c,width=3);star(d,11,44,'#eee0e7')
 elif kind==3:
  poly(d,[(20,8),(13,27),(23,24),(18,40),(34,18),(25,21),(31,8)],c)
 elif kind==4:
  d.ellipse((4,18,60,46),outline=c,width=2);d.ellipse((22,21,42,43),fill='#1a273e');diamond(d,32,31,6,c)
 else:
  poly(d,[(22,17),(19,8),(29,13),(33,6),(37,13),(47,8),(43,19)],'#bba17e');line(d,[(23,17),(42,18)],c,2)
 for x,y in [(8,50),(54,8)]:star(d,x,y,c)
 return im

def keeper_sprite():
 im=new();d=ImageDraw.Draw(im);o='#111923'
 # An original ash-veiled keeper: silver braid, charcoal robe, copper censer.
 d.ellipse((14,50,49,59),fill='#0c151b')
 poly(d,[(25,23),(37,23),(42,34),(49,54),(39,58),(30,54),(19,57),(15,52),(22,34)],o)
 poly(d,[(26,26),(36,26),(40,38),(45,53),(37,55),(30,51),(21,54),(19,51),(25,36)],'#343943')
 poly(d,[(28,29),(29,47),(25,53),(20,53),(25,39)],'#53515a');poly(d,[(35,30),(36,45),(42,53),(37,54),(31,49)],'#222c36')
 line(d,[(23,51),(30,49),(39,53),(44,52)],'#9a8768',2)
 poly(d,[(23,15),(27,9),(36,9),(41,15),(39,27),(34,31),(26,27)],o)
 poly(d,[(25,16),(28,12),(35,12),(38,16),(36,25),(32,28),(27,24)],'#b1a9a4')
 poly(d,[(25,14),(27,10),(35,10),(39,14),(37,18),(35,15),(28,16),(25,22),(23,24)],'#c7c9c9')
 line(d,[(25,15),(37,16)],'#ddd5c6');rect(d,(25,18,38,21),'#34313b');line(d,[(25,18),(37,18)],'#806f6e')
 line(d,[(37,17),(40,26),(38,33),(40,38)],'#b5b6bd',3);line(d,[(38,21),(39,23),(38,26)],'#e3dfd6')
 poly(d,[(23,29),(18,35),(21,41),(29,38),(28,34),(23,36)],'#57505a')
 poly(d,[(38,30),(44,35),(42,41),(34,38),(34,34),(39,36)],'#57505a')
 line(d,[(25,37),(35,37)],'#ccb395',2)
 poly(d,[(27,37),(33,37),(35,43),(32,47),(27,46),(25,42)],'#a88a5e');line(d,[(27,39),(32,39)],'#ead19a',2)
 poly(d,[(29,38),(27,33),(30,29),(33,34),(32,38)],'#d89661');rect(d,(29,33,30,36),'#ffdfaa')
 diamond(d,31,29,2,'#c4ab79')
 return im

def portal_sprite():
 im=Image.new('RGBA',(64,80),(0,0,0,0));d=ImageDraw.Draw(im)
 # Broken stone arch leaves the opening transparent for live light animation.
 d.ellipse((1,65,63,78),fill='#101c29');d.ellipse((4,65,60,75),fill='#39464f');d.arc((5,65,59,75),0,180,fill='#7b8791',width=2)
 for side in [0,1]:
  for j in range(6):
   x=7 if side==0 else 47;y=59-j*8;tilt=(j%2)*2
   poly(d,[(x,y),(x+10,y-tilt),(x+11,y+7),(x-1,y+7)],'#222e3b')
   rect(d,(x+1,y+1,x+8,y+6),'#4d5b68');line(d,[(x+1,y+1),(x+7,y+1)],'#86929f')
   if j in [1,3,5]:line(d,[(x+4,y+2),(x+4,y+5)],'#b7b1e0')
 for x,y in [(14,11),(23,6),(33,6),(42,11)]:
  poly(d,[(x,y),(x+7,y-2),(x+9,y+7),(x+1,y+9)],'#283442');poly(d,[(x+1,y+1),(x+6,y),(x+7,y+5),(x+2,y+7)],'#637180');line(d,[(x+2,y+1),(x+5,y)],'#a4a7ba')
 diamond(d,32,7,5,'#c4bbe7');diamond(d,32,7,2,'#f1deff')
 for x in [10,51]:
  poly(d,[(x-6,65),(x+6,65),(x+8,70),(x-8,70)],'#536573');line(d,[(x-5,65),(x+5,65)],'#a1a7b6')
  diamond(d,x,57,3,'#aaacda')
 return im

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,default=ROOT/'public'/'art');args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True)
 from draw_camp_art import generate as generate_camp
 generate_camp(args.out)
 keeper_sprite().save(args.out/'pixel-keeper.png',optimize=True)
 portal_sprite().save(args.out/'pixel-portal.png',optimize=True)
 tiles=[hero(),skeleton(),ghost(),bat(),boss(),crystal(),blade(),heart()]
 sheet=Image.new('RGBA',(256,128),(0,0,0,0))
 for i,t in enumerate(tiles):sheet.paste(t,((i%4)*64,(i//4)*64))
 sheet.save(args.out/'pixel-sprites.png',optimize=True)
 walk=Image.new('RGBA',(256,64),(0,0,0,0))
 for i in range(4):walk.paste(hero(i),(i*64,0))
 walk.save(args.out/'pixel-walk.png',optimize=True)
 relic_sheet=Image.new('RGBA',(320,64),(0,0,0,0))
 for i in range(5):relic_sheet.paste(relic(i),(i*64,0))
 relic_sheet.save(args.out/'pixel-relics.png',optimize=True)
 impact_sheet=Image.new('RGBA',(320,64),(0,0,0,0))
 for i in range(5):impact_sheet.paste(impact_frame(i),(i*64,0))
 impact_sheet.save(args.out/'pixel-impact.png',optimize=True)
 weapon_sheet=Image.new('RGBA',(384,192),(0,0,0,0))
 for i in range(18):weapon_sheet.paste(weapon_icon(i) if i<12 else union_icon(i-12),((i%6)*64,(i//6)*64))
 weapon_sheet.save(args.out/'pixel-weapons.png',optimize=True)
 weapon_sheet.resize((768,384),Image.Resampling.NEAREST).save(args.out/'pixel-weapons-preview.png')
 from draw_arsenal_expansion import generate as generate_arsenal
 generate_arsenal(args.out)
 from draw_weapon_vfx import generate as generate_vfx
 generate_vfx(args.out)
 from draw_bestiary_art import generate as generate_bestiary
 generate_bestiary(args.out)
 from draw_npc_portraits import generate as generate_npcs
 generate_npcs(args.out)
 from draw_actor_art import generate
 generate(args.out)
 from draw_expansion_art import generate as generate_expansion
 generate_expansion(args.out)
 from draw_frontier_art import generate as generate_frontier
 generate_frontier(args.out)
 from draw_ritual_art import generate as generate_ritual
 generate_ritual(args.out)
 updated=Image.open(args.out/'pixel-sprites.png').convert('RGBA')
 tiles=[updated.crop(((i%4)*64,(i//4)*64,(i%4+1)*64,(i//4+1)*64)) for i in range(8)]
 bg=arena();bg.save(args.out/'pixel-arena.png',optimize=True)
 # A readable art review sheet, rendered solely with integer nearest-neighbor scaling.
 preview=Image.new('RGB',(768,512),'#101b21');preview.paste(bg.resize((768,512),Image.Resampling.NEAREST))
 for i,t in enumerate(tiles):
  tile=t.resize((128,128),Image.Resampling.NEAREST);preview.paste(tile,(32+(i%4)*190,220+(i//4)*135),tile)
 preview.save(args.out/'pixel-preview.png',optimize=True)
 for f in ['pixel-arena.png','pixel-sprites.png','pixel-walk.png','pixel-relics.png','pixel-impact.png']:print(args.out/f)
if __name__=='__main__':main()
