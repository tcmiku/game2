"""Five original 96px enemies, each with idle, walking and attack poses."""
from pathlib import Path
from PIL import Image,ImageDraw
import math
from draw_actor_art import pose
ROOT=Path(__file__).resolve().parents[1]
KINDS=['hound','spore','archer','priest','golem'];INK='#111b27'
def sprite(kind,f):
 im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im);p=pose(f);step=p['step'];bob=p['bob'];attack=p['attack'];lean=p['lean']
 def poly(points,c):d.polygon([(round(x),round(y)) for x,y in points],fill=c)
 def line(points,c,w=1):d.line([(round(x),round(y)) for x,y in points],fill=c,width=w)
 def box(b,c):d.rectangle(tuple(round(x) for x in b),fill=c)
 def diamond(x,y,r,c):poly([(x,y-r),(x+r,y),(x,y+r),(x-r,y)],c)
 if kind=='hound':
  lift=0 if attack<0 else [-4,-8,1,0][attack];sx=0 if attack<0 else [-3,-5,5,1][attack]
  line([(23,57),(11,53),(6,40)],INK,8);line([(23,56),(12,51),(8,41)],'#6b5860',4)
  for x,off in [(26,step),(40,-step),(62,-step),(73,step)]:
   line([(x,58),(x+off,71),(x+off-2,83)],INK,7);line([(x,59),(x+off,72),(x+off-2,81)],'#927568',4);line([(x+off-4,82),(x+off+4,82)],'#c0a68b',3)
  poly([(19,46+lift),(30,36+lift),(57,38+lift),(69,31+lift),(83,43+lift),(81,63),(66,68),(52,61),(27,65),(18,57)],INK)
  poly([(23,47+lift),(32,40+lift),(57,42+lift),(68,36+lift),(77,44+lift),(76,59),(66,63),(53,57),(28,60),(22,55)],'#68545d')
  poly([(32,41+lift),(52,43+lift),(55,49+lift),(39,51+lift),(29,56),(24,53)],'#987865')
  for x,y in [(43,38),(50,36),(57,36),(63,33),(68,31)]:poly([(x-3,y+lift+8),(x,y+lift-4),(x+4,y+lift+8)],'#b9a58d')
  hx=74+sx;hy=31+lift
  poly([(hx-12,hy+5),(hx-12,hy-7),(hx-5,hy-2),(hx+3,hy-6),(hx+8,hy+4),(hx+16,hy+9),(hx+15,hy+20),(hx+4,hy+24),(hx-9,hy+17)],INK)
  poly([(hx-9,hy+5),(hx-9,hy-2),(hx-4,hy+3),(hx+2,hy-1),(hx+5,hy+7),(hx+12,hy+11),(hx+11,hy+17),(hx+3,hy+19),(hx-6,hy+14)],'#aa8a76')
  box((hx+1,hy+7,hx+5,hy+9),'#f2bd7b');box((hx+3,hy+7,hx+4,hy+8),'#ffe8a4');line([(hx+6,hy+12),(hx+12,hy+12)],'#27303a',2)
  line([(hx-2,hy+15),(hx+10,hy+17)],INK,2)
  for x in [hx+1,hx+7]:poly([(x,hy+16),(x+3,hy+16),(x+1,hy+21)],'#e7ddba')
  line([(68,51),(62,56),(62,61)],'#c3ac82',2);diamond(65,57,3,'#dab583')
 elif kind=='spore':
  for x,off in [(38,step),(57,-step)]:line([(x,63),(x+off,76),(x+off-5,83)],INK,9);line([(x,65),(x+off,75),(x+off-4,81)],'#668175',5)
  poly([(33,34+bob),(61,34+bob),(70,53),(65,74),(53,82),(35,75),(27,59)],INK)
  poly([(36,37+bob),(59,37+bob),(65,54),(61,71),(51,77),(38,71),(32,58)],'#526c67')
  poly([(40,44),(57,42),(61,59),(54,69),(41,65),(37,55)],'#83917a');line([(41,45),(38,54),(43,62)],'#b2b294',2)
  arm=-7 if attack in [0,1] else 5 if attack==2 else 0
  for side in [-1,1]:line([(48+side*15,43),(48+side*24,53+arm),(48+side*27,64+arm)],INK,8);line([(48+side*15,44),(48+side*22,53+arm),(48+side*24,62+arm)],'#8b947b',4)
  poly([(20,30+bob),(25,17+bob),(38,10+bob),(53,8+bob),(68,16+bob),(77,31+bob),(72,40+bob),(24,40+bob)],INK)
  poly([(24,29+bob),(29,19+bob),(40,14+bob),(53,12+bob),(65,19+bob),(72,30+bob),(68,35+bob),(28,35+bob)],'#876a66')
  line([(27,31+bob),(68,31+bob)],'#bd9176',4);line([(29,35+bob),(66,35+bob)],'#e4c596',2)
  for x,y,r in [(37,21,5),(53,18,4),(62,25,4),(28,28,3)]:diamond(x,y+bob,r,'#d1bd89');diamond(x,y+bob,r-2,'#eaddb4')
  box((36,40+bob,43,43+bob),INK);box((53,40+bob,60,43+bob),INK);box((38,41+bob,41,42+bob),'#efba85');box((55,41+bob,58,42+bob),'#efba85')
  for x,y in [(33,62),(58,64),(50,53)]:diamond(x,y,4,'#be8f69');diamond(x,y,2,'#e4c18a')
 elif kind=='archer':
  for x,off in [(38,step),(55,-step)]:line([(x,63),(x+off,73),(x+off-2,83)],INK,7);line([(x,64),(x+off,73),(x+off-2,82)],'#abae96',3);line([(x+off-5,83),(x+off+2,83)],'#d5c7a8',2)
  poly([(31,35),(58,34),(65,52),(58,70),(43,73),(29,64),(27,49)],INK);poly([(34,38),(55,37),(60,52),(54,66),(43,69),(33,62),(31,49)],'#4b5361')
  line([(35,40),(48,46),(57,40)],'#b79d73',3);line([(35,58),(57,58)],'#8e7656',3);diamond(46,58,3,'#d7bb85')
  for y in [44,49,54]:line([(39,y),(43,y+2),(51,y)],'#aeb29a',2)
  hx=63+(0 if attack<0 else [-5,-3,5,0][attack]);hy=49+(-5 if attack in [0,1] else 0)
  for points in [[(32,39),(28,50),(hx-7,hy+2)],[(57,39),(64,41),(hx,hy)]]:line(points,INK,7);line(points,'#b9b69c',3)
  # A large crescent crossbow and a stocked, carved receiver.
  line([(hx-12,hy+10),(hx+18,hy-2)],INK,7);line([(hx-10,hy+9),(hx+17,hy-2)],'#9e795c',4)
  line([(hx+10,hy-19),(hx+17,hy-10),(hx+19,hy),(hx+14,hy+14)],INK,6);line([(hx+10,hy-18),(hx+15,hy-9),(hx+16,hy),(hx+13,hy+12)],'#d0ba8c',3)
  line([(hx+10,hy-18),(hx+2,hy-1),(hx+13,hy+12)],'#a4ad9b');line([(hx-2,hy+3),(hx+22,hy-3)],'#ece0b7',2)
  poly([(32,17+bob),(40,10+bob),(53,11+bob),(62,22+bob),(59,35+bob),(51,41+bob),(37,36+bob),(29,28+bob)],INK)
  poly([(35,19+bob),(41,14+bob),(51,15+bob),(58,23+bob),(55,33+bob),(49,37+bob),(39,33+bob),(33,27+bob)],'#c2b89b')
  box((34,23+bob,42,28+bob),'#313644');box((49,23+bob,56,28+bob),'#313644');box((37,24+bob,40,25+bob),'#e8b77c');box((51,24+bob,54,25+bob),'#e8b77c')
  line([(42,33+bob),(51,33+bob)],'#74685d',2);line([(40,12+bob),(53,13+bob),(58,20+bob)],'#657783',3)
 elif kind=='priest':
  sway=step//2;poly([(33,33),(58,33),(65,54),(71+sway,80),(61,76),(57,88),(48,81),(39,88),(28,80),(24-sway,75),(30,53)],INK)
  poly([(36,36),(55,36),(59,54),(65+sway,78),(57,74),(53,82),(47,77),(39,83),(30,77),(34,54)],'#4e435e');poly([(40,41),(46,44),(43,70),(37,80),(33,76)],'#897486')
  line([(36,74),(46,76),(58,74)],'#c1a77e',2);line([(50,44),(53,63),(55,71)],'#b29492',2)
  arm=-14 if attack in [0,1] else -4 if attack==2 else 0
  line([(34,39),(24,46+arm),(25,58+arm)],INK,8);line([(34,40),(27,47+arm),(28,56+arm)],'#b4a18a',4)
  line([(57,39),(69,46+arm),(70,57+arm)],INK,8);line([(57,40),(66,47+arm),(67,55+arm)],'#b4a18a',4)
  line([(70,82),(72,24)],INK,5);line([(70,80),(72,25)],'#ac926c',2)
  # The tomb bell hangs from a crooked crozier.
  line([(72,27),(71,18),(65,14),(60,18),(60,25)],'#d1b681',3)
  poly([(55,24),(65,24),(66,34),(70,40),(68,44),(51,44),(49,40),(54,34)],INK);poly([(57,27),(63,27),(63,35),(66,40),(54,40),(57,34)],'#b7a476');line([(54,41),(66,41)],'#ead1a0',2);box((59,42,61,47),'#d3bb8a')
  poly([(30,24+bob),(35,12+bob),(45,6+bob),(57,14+bob),(62,27+bob),(56,39+bob),(35,38+bob)],INK)
  poly([(34,25+bob),(39,15+bob),(45,11+bob),(54,18+bob),(57,28+bob),(52,34+bob),(38,34+bob)],'#796071')
  poly([(39,24+bob),(50,23+bob),(54,29+bob),(49,36+bob),(40,33+bob),(37,29+bob)],'#c8b9a2');box((39,26+bob,43,28+bob),INK);box((48,26+bob,52,28+bob),INK)
  line([(44,31+bob),(48,32+bob)],'#847266');diamond(45,18+bob,3,'#dbb58b')
 elif kind=='golem':
  for x,off in [(34,step),(62,-step)]:poly([(x-9,63),(x+9,63),(x+11+off,81),(x+6+off,88),(x-13+off,87),(x-12+off,78)],INK);box((x-7+off,69,x+6+off,83),'#677477');line([(x-7+off,72),(x+5+off,72)],'#adb4a1',2)
  poly([(25,28),(65,25),(76,43),(70,68),(57,77),(32,71),(20,51)],INK)
  poly([(28,32),(63,29),(70,44),(65,64),(56,70),(35,66),(26,51)],'#56666a');poly([(32,32),(49,32),(45,46),(29,49)],'#8b9690');poly([(50,34),(63,32),(67,45),(55,49)],'#718583')
  line([(28,51),(38,48),(46,54),(54,49),(66,52)],INK,3);line([(45,35),(44,48),(49,53),(46,66)],'#243c45',2)
  diamond(48,48,9,'#273f4a');diamond(48,48,6,'#af9d72');diamond(48,48,3,'#f0d3a1')
  for side in [-1,1]:
   lift=0 if attack<0 else [-17,-23,7,0][attack];x=48+side*29;y=46+lift
   poly([(x-side*5,y-13),(x+side*12,y-12),(x+side*17,y+5),(x+side*13,y+24),(x-side*8,y+22),(x-side*13,y+5)],INK)
   poly([(x-side*3,y-9),(x+side*9,y-8),(x+side*12,y+5),(x+side*9,y+19),(x-side*5,y+17),(x-side*9,y+5)],'#758784')
   line([(x-side*5,y+5),(x+side*10,y+5)],'#b6bba6',2);line([(x,y+8),(x+side*2,y+16)],'#3a535b',2)
  poly([(31,11+bob),(41,6+bob),(61,9+bob),(67,23+bob),(62,35+bob),(39,36+bob),(29,26+bob)],INK)
  poly([(35,13+bob),(43,10+bob),(59,12+bob),(62,23+bob),(58,31+bob),(41,32+bob),(33,25+bob)],'#89958a')
  line([(36,16+bob),(57,15+bob)],'#c3c5a9',2);box((36,22+bob,44,25+bob),'#263e47');box((51,21+bob,60,24+bob),'#263e47');box((39,22+bob,43,23+bob),'#f4ca8e');box((53,21+bob,57,22+bob),'#f4ca8e')
  line([(41,29+bob),(56,28+bob)],'#455e62',2)
  for x,y in [(29,34),(61,30),(25,51),(60,65)]:box((x,y,x+4,y+2),'#76916c');box((x+2,y-2,x+3,y),'#9aab7c')
 # Small chips, stitches, gills and metal inlays share the native pixel grid.
 if kind=='hound':
  for x,y in [(27,48),(34,46),(43,48),(51,50)]:line([(x,y+lift),(x+3,y+lift-2)],'#c1a082');line([(x+1,y+lift+3),(x+4,y+lift+1)],'#433f4d')
  line([(58,46+lift),(62,49+lift),(59,55+lift)],'#ccae91');line([(59,46+lift),(61,54+lift)],'#403b45')
 elif kind=='spore':
  for x in range(29,69,5):line([(x,35+bob),(x+1,38+bob)],'#70564f')
  for x,y in [(31,24),(47,17),(61,21),(66,29),(42,28)]:box((x,y+bob,x+1,y+1+bob),'#d5ad83')
  line([(47,48),(44,55),(49,59),(47,68)],'#46595a');line([(48,49),(46,54)],'#c9c49a')
 elif kind=='archer':
  for x in [41,45,49]:line([(x,32+bob),(x,35+bob)],'#5b5f5b')
  line([(40,15+bob),(44,18+bob),(43,21+bob)],'#73776b');line([(33,46),(35,54),(39,57)],'#849086')
  for x,y in [(36,42),(54,42),(36,61),(53,62)]:box((x,y,x+1,y+1),'#e5d2a4')
 elif kind=='priest':
  for x,y in [(39,48),(38,59),(35,70),(54,57),(56,69)]:line([(x,y),(x-1,y+5)],'#ae9697')
  line([(45,47),(43,64),(47,73)],'#332e45');line([(31,77),(38,79),(44,76),(51,79),(58,76)],'#a58e79')
  line([(57,33),(61,34),(64,32)],'#f0d1a0');box((59,36,61,38),'#6f6956')
 elif kind=='golem':
  for x,y in [(36,16),(54,13),(32,41),(62,39),(37,60),(57,62)]:line([(x,y),(x+3,y+1),(x+2,y+4)],'#344d55');box((x-1,y,x,y),'#c1c4a7')
  line([(29,57),(37,55),(40,61)],'#9caa96');line([(54,57),(63,59)],'#9ca693')
 return im

def ornament():
 im=Image.new('RGBA',(384,192));d=ImageDraw.Draw(im);gold='#bda575';light='#e4cda3';dark='#5c625f'
 # A moon crest, leafy copper branches and small cut-stone stars.
 for side in [-1,1]:
  pts=[(192+side*x,y) for x,y in [(12,49),(35,42),(58,47),(82,37),(108,42),(135,32),(169,36)]];d.line(pts,fill=gold,width=1)
  for i in range(7):
   x=192+side*(30+i*21);y=42-(i%3)*4
   d.polygon([(x,y),(x+side*9,y-12),(x+side*13,y-11),(x+side*6,y-3)],fill=dark)
   d.line([(x,y),(x+side*10,y-10)],fill=gold)
   d.polygon([(x,y),(x+side*9,y+9),(x+side*12,y+8),(x+side*5,y+2)],fill=dark)
  d.line([(192+side*35,62),(192+side*85,62)],fill=(189,165,117,70))
 d.ellipse((170,18,214,63),outline=gold,width=1);d.arc((175,23,209,58),65,300,fill=light,width=3)
 d.polygon([(193,7),(197,13),(193,19),(189,13)],fill=gold);d.polygon([(193,65),(196,69),(193,74),(190,69)],fill=gold)
 for x,y in [(22,35),(361,35),(151,53),(234,53)]:d.line([(x-3,y),(x+3,y)],fill=light);d.line([(x,y-3),(x,y+3)],fill=light)
 # A compact seal occupies the first 96px cell of the lower row.
 d.ellipse((15,111,81,177),outline=(189,165,117,120),width=1);d.ellipse((22,118,74,170),outline=gold,width=1)
 d.arc((31,126,66,162),75,295,fill=light,width=3)
 for i in range(8):
  a=i*math.tau/8;x=48+round(math.cos(a)*30);y=144+round(math.sin(a)*30);d.rectangle((x-1,y-1,x+1,y+1),fill=gold)
 return im

def generate(out):
 out=Path(out);out.mkdir(parents=True,exist_ok=True);atlas=Image.new('RGBA',(1152,480));review=Image.new('RGB',(768,960),'#17232d')
 for row,kind in enumerate(KINDS):
  for f in range(12):
   tile=sprite(kind,f);bbox=tile.getbbox();assert bbox and bbox[0]>=0 and bbox[1]>=0 and bbox[2]<=96 and bbox[3]<=96,(kind,f,bbox);atlas.paste(tile,(f*96,row*96))
  for col,f in enumerate([0,3,6,10]):
   tile=sprite(kind,f).resize((192,192),Image.Resampling.NEAREST);review.paste(tile,(col*192,row*192),tile)
 atlas.save(out/'pixel-bestiary.png',optimize=True);review.save(out/'pixel-bestiary-preview.png',optimize=True);ornament().save(out/'pixel-ui.png',optimize=True)
 frames=[]
 for f in range(12):
  canvas=Image.new('RGB',(960,192),'#17232d')
  for i,kind in enumerate(KINDS):
   tile=sprite(kind,f).resize((192,192),Image.Resampling.NEAREST);canvas.paste(tile,(i*192,0),tile)
  frames.append(canvas)
 frames[0].save(out/'pixel-bestiary-motion.gif',save_all=True,append_images=frames[1:],duration=110,loop=0,disposal=2)
if __name__=='__main__':generate(ROOT/'public'/'art')
