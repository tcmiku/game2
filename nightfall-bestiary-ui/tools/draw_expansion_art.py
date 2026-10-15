#!/usr/bin/env python3
"""Native 96px ranged cultist, death, and blacksmith sprites, drawn with Pillow."""
from pathlib import Path
import math
from PIL import Image,ImageDraw
from draw_actor_art import pose
ROOT=Path(__file__).resolve().parents[1]
INK='#101923'
def sprite(kind,frame):
 im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im);p=pose(frame);step=p['step'];bob=p['bob'];attack=p['attack']
 def poly(points,c):d.polygon(points,fill=c)
 def line(points,c,w=1):d.line(points,fill=c,width=w)
 def box(b,c):d.rectangle(b,fill=c)
 def diamond(x,y,r,c):poly([(x,y-r),(x+r,y),(x,y+r),(x-r,y)],c)
 if kind=='ranger':
  # The lantern cultist: vermilion lining, plated mask and a carved casting staff.
  for x,off in [(39,step),(54,-step)]:
   box((x-3,64,x+3,80+off),INK);box((x-2,68,x+1,79+off),'#6b6561');box((x-5,79+off,x+3,83+off),'#39444b');line([(x-4,79+off),(x+2,79+off)],'#a5987d')
  poly([(32,35),(58,35),(67,62),(64,79),(56,74),(50,81),(43,74),(34,80),(25,73),(28,53)],INK)
  poly([(33,38),(57,38),(61,62),(59,74),(51,72),(47,77),(40,70),(33,75),(29,70)],'#563f4c')
  poly([(34,40),(41,45),(39,66),(33,73),(31,65)],'#95615f');line([(32,45),(34,62),(32,70)],'#c48a72')
  poly([(50,43),(57,43),(60,67),(53,73),(49,69)],'#2e303e');line([(49,48),(51,66),(55,70)],'#78606a')
  line([(32,58),(57,58)],'#b99463',2);diamond(46,58,3,'#e4c389')
  hx=66+(0 if attack<0 else [0,4,7,3][attack]);hy=48+(step//2 if attack<0 else [-9,-11,0,2][attack])
  line([(57,40),(63,46),(hx,hy)],INK,7);line([(57,41),(63,46),(hx,hy)],'#8b7f70',4);box((hx-2,hy-2,hx+2,hy+2),'#d1b999')
  line([(hx,hy+28),(hx+4,hy-22)],INK,5);line([(hx,hy+28),(hx+4,hy-22)],'#a2825e',2)
  poly([(hx-3,hy-19),(hx-4,hy-28),(hx+4,hy-33),(hx+11,hy-27),(hx+10,hy-18)],INK)
  diamond(hx+4,hy-25,7,'#a55f56');diamond(hx+4,hy-25,4,'#f3a06f');diamond(hx+4,hy-26,2,'#fff0bd')
  line([(30,42),(25,48),(28,56)],INK,7);line([(30,42),(26,48),(28,54)],'#8b7a71',4);box((26,53,30,57),'#bfa78b')
  poly([(29,26+bob),(33,13+bob),(45,7+bob),(58,16+bob),(62,30+bob),(55,41+bob),(35,39+bob)],INK)
  poly([(32,26+bob),(36,16+bob),(45,11+bob),(55,18+bob),(58,29+bob),(52,37+bob),(36,35+bob)],'#704a55')
  line([(34,24+bob),(39,16+bob),(46,13+bob),(53,20+bob)],'#b57871',2)
  poly([(37,24+bob),(52,22+bob),(55,29+bob),(50,36+bob),(39,34+bob),(35,29+bob)],'#c3b69b')
  box((38,26+bob,43,29+bob),INK);box((48,25+bob,53,28+bob),INK);box((39,27+bob,41,28+bob),'#ffc581');box((49,26+bob,51,27+bob),'#ffc581')
  line([(44,30+bob),(47,33+bob),(50,31+bob)],'#716760');line([(36,35+bob),(42,38+bob),(53,35+bob)],'#d2aa80')
 elif kind=='death':
  # A tall, narrow crimson shroud and a great bone sickle, distinct from the king.
  sway=step//2;poly([(34,32),(59,32),(63,52),(73+sway,78),(63,74),(64+sway,88),(53,83),(47,90),(40,82),(28,87),(31,77),(20-sway,81),(28,55)],INK)
  poly([(36,36),(57,36),(58,54),(67+sway,77),(59,74),(59+sway,83),(52,79),(47,85),(41,77),(32,82),(35,71),(26,75),(33,53)],'#3d2940')
  poly([(37,39),(44,41),(41,66),(34,77),(36,62)],'#875160');line([(36,46),(38,61),(34,72)],'#b96972',2)
  poly([(50,40),(56,39),(57,62),(62,76),(55,73),(49,60)],'#1d2535');line([(48,47),(48,70),(51,79)],'#644455',2)
  for yy in [41,45,49]:line([(39,yy),(45,yy+2),(52,yy)],'#9b8c91',2)
  hx=65+(0 if attack<0 else [-5,4,10,2][attack]);hy=56+(step//3 if attack<0 else [-4,-6,0,0][attack])
  line([(55,38),(61,43),(hx,hy)],INK,7);line([(55,38),(61,43),(hx,hy)],'#bcbba5',3)
  line([(hx-5,hy+31),(hx+5,hy-30)],INK,6);line([(hx-5,hy+31),(hx+5,hy-30)],'#988484',3);line([(hx-4,hy+28),(hx+5,hy-29)],'#d0c4ac')
  poly([(hx+4,hy-30),(hx-8,hy-43),(hx-30,hy-39),(hx-50,hy-23),(hx-55,hy-6),(hx-44,hy-20),(hx-28,hy-30),(hx-10,hy-32),(hx+5,hy-22)],INK)
  poly([(hx+2,hy-29),(hx-9,hy-40),(hx-29,hy-36),(hx-47,hy-22),(hx-52,hy-10),(hx-42,hy-23),(hx-28,hy-32),(hx-10,hy-34),(hx+3,hy-24)],'#bac7b5')
  line([(hx-52,hy-10),(hx-47,hy-23),(hx-29,hy-37),(hx-9,hy-41),(hx+2,hy-29)],'#edf0d2',2)
  line([(33,39),(27,46),(28,54)],'#a7a59d',3);box((25,52,31,56),'#cdc5af')
  poly([(30,26+bob),(35,12+bob),(46,6+bob),(59,15+bob),(62,29+bob),(57,38+bob),(34,38+bob)],INK)
  poly([(34,26+bob),(38,15+bob),(46,10+bob),(56,18+bob),(58,29+bob),(53,34+bob),(37,34+bob)],'#633b50');line([(36,23+bob),(40,16+bob),(46,12+bob)],'#ad6571',2)
  poly([(38,24+bob),(52,23+bob),(55,29+bob),(51,35+bob),(47,40+bob),(40,36+bob),(36,30+bob)],'#d5ceb3')
  box((38,26+bob,43,29+bob),'#332536');box((48,25+bob,53,28+bob),'#332536');box((39,27+bob,42,28+bob),'#ff657b');box((49,26+bob,52,27+bob),'#ff657b')
  poly([(45,30+bob),(43,34+bob),(48,34+bob)],'#5a4854');line([(41,36+bob),(49,37+bob)],'#75616a')
 elif kind=='smith':
  k=frame%4;lift=[0,-13,-22,-3][k]
  for x in [39,57]:box((x-5,66,x+4,84),INK);box((x-4,68,x+2,80),'#645248');box((x-7,80,x+5,86),'#3c4147');line([(x-6,80),(x+3,80)],'#a19a81')
  poly([(30,33),(58,31),(65,45),(60,70),(37,74),(28,57)],INK)
  poly([(33,35),(57,34),(61,46),(57,68),(39,70),(31,55)],'#955f48')
  poly([(36,38),(54,38),(59,67),(50,74),(35,69)],'#54443f');line([(37,39),(36,66),(48,71),(57,66)],'#a7835b',2)
  line([(32,36),(39,50),(54,36)],'#cc9b6a',3);box((39,51,53,61),'#705747');line([(40,52),(52,52)],'#b38b60')
  box((34,64,59,67),'#b29367');box((43,63,49,68),'#d2b777')
  line([(32,37),(24,46),(28,58)],INK,11);line([(32,37),(25,46),(29,56)],'#bf8360',7);line([(26,46),(30,50)],'#e0a67a',2)
  line([(58,37),(69,40+lift//2),(73,53+lift)],INK,11);line([(58,37),(68,40+lift//2),(72,51+lift)],'#b57555',7);line([(64,39+lift//2),(68,42+lift//2)],'#df9e72',2)
  line([(73,57+lift),(75,35+lift)],INK,6);line([(73,56+lift),(75,36+lift)],'#a98052',3)
  poly([(67,30+lift),(82,31+lift),(86,38+lift),(81,44+lift),(66,40+lift)],INK);poly([(68,32+lift),(81,33+lift),(83,38+lift),(79,41+lift),(68,38+lift)],'#8ea3a1');line([(69,32+lift),(80,33+lift)],'#d4dbbf',2)
  poly([(33,19),(37,11),(50,10),(58,17),(57,30),(50,38),(38,34)],INK)
  poly([(36,20),(39,14),(49,13),(54,18),(53,28),(48,34),(39,31)],'#c38b66');line([(39,16),(47,15)],'#e4b88b')
  box((36,22,53,25),'#3e3f40');box((38,22,43,24),'#9bc6c3');box((47,22,52,24),'#9bc6c3')
  poly([(37,27),(42,29),(48,28),(54,25),(51,35),(47,39),(39,35)],'#aeb3a6');line([(39,30),(43,34),(47,34),(51,29)],'#e1d8bb')
 return im

def generate(out):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 sheet=Image.new('RGBA',(1152,288))
 for row,kind in enumerate(['ranger','death']):
  for frame in range(12):
   tile=sprite(kind,frame);bounds=tile.getbbox()
   if bounds[0]<1 or bounds[1]<1 or bounds[2]>95 or bounds[3]>95:raise ValueError(f'{kind} {frame}: {bounds}')
   sheet.paste(tile,(frame*96,row*96))
 for i in range(2):
  im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
  def diamond(x,y,r,c):d.polygon([(x,y-r),(x+r,y),(x,y+r),(x-r,y)],fill=c)
  if i==0:
   for r,c in [(23,'#171e2b'),(19,'#e96c5a'),(14,'#ffb67b'),(7,'#fff3c0')]:diamond(48,48,r,c)
   for x,y in [(29,28),(66,29),(28,65),(66,66)]:d.rectangle((x,y,x+3,y+3),fill='#ffd795')
  else:
   d.polygon([(20,44),(57,30),(78,48),(57,66),(20,52),(39,48)],fill='#17212a');d.polygon([(27,45),(58,35),(72,48),(58,61),(27,51),(46,48)],fill='#ee8268');d.line([(43,48),(66,48)],fill='#fff2b8',width=5)
  sheet.paste(im,(i*96,192))
 sheet.save(out/'pixel-foes.png',optimize=True)
 smith=Image.new('RGBA',(384,96))
 for f in range(4):smith.paste(sprite('smith',f),(f*96,0))
 smith.save(out/'pixel-smith.png',optimize=True)
 review=Image.new('RGB',(768,576),'#17232d')
 for row,kind in enumerate(['ranger','death','smith']):
  for col,f in enumerate([0,3,6,10] if kind!='smith' else range(4)):
   tile=sprite(kind,f).resize((192,192),Image.Resampling.NEAREST);review.paste(tile,(col*192,row*192),tile)
 review.save(out/'pixel-expansion-preview.png',optimize=True)
 print('Pixel expansion sprites generated')
if __name__=='__main__':generate(ROOT/'public'/'art')
