"""Hand-painted integer pixel silhouettes for the second arsenal expansion."""
from pathlib import Path
from PIL import Image, ImageDraw
import math
O='#101b25'
def icon(kind):
 im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
 def line(p,c,w=1):d.line(p,fill=c,width=w)
 def poly(p,c):d.polygon(p,fill=c)
 def rect(b,c):d.rectangle(b,fill=c)
 def diamond(x,y,r,c):poly([(x,y-r),(x+r,y),(x,y+r),(x-r,y)],c)
 def star(x,y,c):line([(x-3,y),(x+3,y)],c);line([(x,y-3),(x,y+3)],c);rect((x,y,x+1,y+1),'#f7f0d3')
 if kind in [0,8]:
  # Silver throwing knife: bevel, wrapped grip, and a ring pommel.
  for off in ([0] if kind==0 else [-12,0,12]):
   poly([(11+off,53),(15+off,46),(27+off,32),(30+off,19),(47+off,5),(43+off,26),(30+off,36),(20+off,48),(18+off,56)],O)
   poly([(27+off,32),(31+off,20),(44+off,9),(40+off,25),(30+off,33)],'#6e88a1')
   poly([(29+off,31),(44+off,9),(35+off,27)],'#d8e4db');line([(31+off,24),(41+off,13)],'#fbf3cf',2)
   line([(17+off,47),(28+off,34)],'#7d6b8c',4);line([(18+off,45),(21+off,47)],'#b8a8be',2);line([(22+off,40),(25+off,42)],'#b8a8be',2)
   line([(22+off,31),(31+off,40)],'#c3b48b',3);diamond(16+off,51,4,'#809cae');diamond(16+off,51,2,O)
  if kind==8:
   d.arc((6,7,56,57),10,290,fill='#9de7df',width=2);star(9,16,'#a5e9e1');star(54,44,'#a5e9e1')
 elif kind==1:
  # Open mirrored chakram, four sharpened shoulders.
  d.ellipse((8,8,56,56),fill=O);d.ellipse((11,11,53,53),fill='#578a8c');d.ellipse((14,14,50,50),outline='#d0eee1',width=3)
  d.ellipse((21,21,43,43),fill=O);d.ellipse((24,24,40,40),fill=(0,0,0,0))
  for i in range(4):
   a=i*math.pi/2
   pts=[(32+round(math.cos(a+t)*r),32+round(math.sin(a+t)*r)) for t,r in [(0,30),(.28,23),(.55,27),(.45,17)]]
   poly(pts,'#8dd8d0')
  line([(18,18),(24,14),(32,13)],'#f2f6d7',2);diamond(46,32,4,'#d3bf7d');diamond(18,32,3,'#b9dcca')
 elif kind==2:
  # Pressure rune with a raised brass igniter and a faceted steel casing.
  d.ellipse((9,42,55,57),fill=O)
  poly([(11,34),(20,24),(44,24),(54,34),(51,48),(40,54),(21,52),(12,45)],O)
  poly([(14,34),(22,27),(43,27),(51,35),(48,46),(39,50),(23,49),(15,43)],'#6a736c')
  poly([(14,35),(25,40),(48,36),(48,45),(38,49),(23,47),(16,41)],'#3e5355')
  d.ellipse((19,26,45,43),fill='#ba905c');d.ellipse((23,28,41,39),fill='#e7c083');d.ellipse((27,30,37,36),fill='#716143')
  for x,y in [(17,36),(23,45),(45,40)]:rect((x,y,x+2,y+2),'#d3d2a0')
  line([(32,30),(31,17),(37,11)],O,5);line([(32,29),(32,18),(37,13)],'#d9b174',2);star(38,11,'#ffe6a7')
 elif kind in [3,9]:
  # Tripod cannon: stepped gears, copper plate, a luminous heat chamber.
  for p in [[(29,36),(17,54),(10,54)],[(35,36),(47,54),(54,54)],[(32,39),(32,58)]]:line(p,O,8);line(p,'#8a8069',4)
  poly([(17,26),(25,20),(40,20),(47,27),(45,43),(36,49),(24,46),(17,39)],O)
  poly([(20,28),(27,23),(39,23),(44,29),(42,41),(35,45),(26,43),(21,37)],'#886e58')
  rect((25,30,39,40),'#4d5355');rect((29,31,35,39),'#efb471');rect((31,32,33,36),'#ffe5b5')
  poly([(32,23),(35,9),(44,6),(50,12),(44,29),(38,32)],O);poly([(36,23),(38,11),(44,9),(47,13),(42,25)],'#b2a186');line([(39,13),(43,11)],'#f4d4a0',2)
  d.ellipse((18,31,25,38),fill='#d3b77b');d.ellipse((19,32,23,36),fill='#665c4d')
  if kind==9:
   poly([(12,21),(15,9),(23,5),(28,11),(25,26)],O);poly([(15,20),(18,10),(23,8),(25,12),(22,23)],'#d2aa6c')
   star(52,18,'#e9c285');star(9,42,'#e9c285');line([(22,45),(41,44)],'#f6d493',2)
 elif kind==4:
  # Linked iron loops and a hooked amethyst anchor.
  for x,y in [(14,15),(21,23),(28,31),(35,39)]:
   d.ellipse((x-6,y-5,x+6,y+5),outline=O,width=4);d.ellipse((x-5,y-4,x+5,y+4),outline='#9f95bc',width=2);line([(x-3,y-3),(x+2,y-3)],'#e0d5dd')
  poly([(34,37),(40,30),(47,33),(50,44),(46,54),(36,56),(29,48),(36,50),(41,47),(41,41)],O)
  poly([(37,38),(41,34),(45,36),(47,44),(43,51),(36,52),(33,49),(39,49),(44,44),(43,39)],'#9d8ac7');diamond(43,40,3,'#d4c3eb')
 elif kind in [5,10]:
  # Twelve-tooth serrated disc; colored metal rings keep it legible in battle.
  pts=[]
  for i in range(48):
   a=i*math.tau/48;r=28 if i%4<2 else 22;pts.append((32+round(math.cos(a)*r),32+round(math.sin(a)*r)))
  poly(pts,O);pts=[(32+round((x-32)*.87),32+round((y-32)*.87)) for x,y in pts];poly(pts,'#a888a4' if kind==10 else '#a87b82')
  d.ellipse((14,14,50,50),fill='#473e54' if kind==10 else '#4b3f4a');d.ellipse((17,17,47,47),outline='#d9a5d4' if kind==10 else '#d7a5a1',width=3)
  for i in range(6):
   a=i*math.tau/6;x=32+round(math.cos(a)*12);y=32+round(math.sin(a)*12);diamond(x,y,3,'#d2c5b2')
  d.ellipse((25,25,39,39),fill=O);diamond(32,32,6,'#c199da' if kind==10 else '#de9092');diamond(32,32,3,'#f6dcc2')
  if kind==10:
   d.arc((5,7,59,57),15,300,fill='#caade1',width=2);star(11,12,'#e2c9eb');star(52,52,'#e2c9eb')
 elif kind in [6,11]:
  # Patinated wind bell and ribbon; evolved version has a lightning crown.
  line([(32,12),(32,6)],'#c4b279',3);d.arc((24,5,40,20),180,360,fill='#d6d3aa',width=2)
  poly([(26,13),(38,13),(43,23),(44,32),(50,39),(48,44),(17,44),(14,39),(21,32),(22,23)],O)
  poly([(27,16),(36,16),(39,24),(40,33),(46,39),(45,41),(19,41),(18,39),(24,33),(25,24)],'#6aa390')
  poly([(27,18),(30,17),(28,33),(23,38),(20,38),(25,29)],'#b9d8b7');line([(20,40),(45,40)],'#e5dca5',2)
  rect((30,42,34,48),'#cfc48d');poly([(31,47),(36,46),(43,51),(40,58),(34,57),(28,61),(26,54)],'#a9ceba');line([(31,49),(37,53),(34,57)],'#e2ebcb')
  if kind==11:
   poly([(47,4),(40,18),(47,17),(42,29),(55,12),(48,13),(53,4)],'#d7eabd');star(12,22,'#b7e7cd')
 elif kind==7:
  # A coiled thorn whip, bone grip and little olive barbs.
  line([(12,53),(22,36)],O,8);line([(13,52),(23,35)],'#9c7a59',4)
  for y in [43,47]:line([(15,y),(19,y+2)],'#d4bb8e',2)
  d.arc((17,7,55,45),120,435,fill=O,width=6);d.arc((18,8,54,44),120,435,fill='#9b9e70',width=3)
  d.arc((24,15,48,37),-60,210,fill='#d0c698',width=2);line([(45,19),(41,14),(37,18)],'#d0c698',2)
  for x,y in [(21,18),(36,8),(52,25),(36,43),(25,34)]:poly([(x,y),(x-4,y-5),(x+2,y-3)],'#d9d4a2')
  diamond(22,36,4,'#c8b985');star(53,50,'#bdcd9e')
 return im

def generate(out):
 out=Path(out);old=Image.open(out/'pixel-weapons.png').convert('RGBA');sheet=Image.new('RGBA',(384,320));sheet.paste(old.crop((0,0,384,192)),(0,0))
 review=Image.new('RGB',(768,256),'#14212b')
 for i in range(12):
  tile=icon(i);index=18+i;sheet.paste(tile,((index%6)*64,(index//6)*64));review.paste(tile.resize((128,128),Image.Resampling.NEAREST),((i%6)*128,(i//6)*128),tile.resize((128,128),Image.Resampling.NEAREST))
 sheet.save(out/'pixel-weapons.png',optimize=True);sheet.resize((768,640),Image.Resampling.NEAREST).save(out/'pixel-weapons-preview.png',optimize=True)
 review.save(out/'pixel-arsenal-expansion-preview.png',optimize=True)
if __name__=='__main__':generate(Path(__file__).resolve().parents[1]/'public/art')
