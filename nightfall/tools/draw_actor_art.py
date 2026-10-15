#!/usr/bin/env python3
"""Original 96px character art: two idle, six walk, four attack poses.
All limbs, cloth, feathers and highlights are drawn on the native pixel grid.
"""
from pathlib import Path
import math
from PIL import Image, ImageDraw

CELL=96
ROWS=['wanderer','skeleton','wraith','bat','king','warden']
INK='#101923';IVORY='#e4e3c7';BONE='#c0c1a2';GOLD='#bea06b'
def poly(d,p,c):d.polygon(p,fill=c)
def line(d,p,c,w=1):d.line(p,fill=c,width=w)
def box(d,p,c):d.rectangle(p,fill=c)
def diamond(d,x,y,r,c):poly(d,[(x,y-r),(x+r,y),(x,y+r),(x-r,y)],c)
def limb(d,points,c,w=4,hi=None):
 line(d,points,INK,w+3);line(d,points,c,w)
 if hi:line(d,[(x-1,y-1) for x,y in points],hi,1)
def pose(frame):
 if frame<2:return dict(step=0,lift=0,bob=frame,sway=frame,attack=-1,lean=0,reach=0)
 if frame<8:
  j=frame-2;return dict(step=[0,4,3,0,-4,-3][j],lift=[0,-2,-1,0,0,0][j],bob=[0,1,0,0,1,0][j],sway=[-3,-1,3,2,0,-3][j],attack=-1,lean=0,reach=0)
 j=frame-8;return dict(step=0,lift=0,bob=[1,0,-1,0][j],sway=[-4,-2,4,2][j],attack=j,lean=[-2,1,4,1][j],reach=[-4,4,13,5][j])

def wanderer(frame):
 im=Image.new('RGBA',(CELL,CELL));d=ImageDraw.Draw(im);p=pose(frame);s=p['step'];b=p['bob'];q=p['sway'];k=p['lean'];a=p['attack'];r=p['reach']
 # Layered cape, embroidered edge, torn silk and separate boot silhouettes.
 poly(d,[(39+k,31+b),(29+k,37+b),(27+q,56),(18+q,70),(22+q,72),(16+q,78),(30+q,77),(37,73),(46,78),(59,70),(64+k,46),(55+k,32)],INK)
 poly(d,[(38+k,35+b),(31+k,40+b),(31+q,56),(24+q,69),(27+q,70),(22+q,74),(32+q,72),(37,69),(43,74),(54,68),(59+k,46),(53+k,36)],'#284b4b')
 poly(d,[(36+k,40),(33+q,59),(27+q,69),(32+q,68),(41+k,49),(42+k,36)],'#3e7565')
 line(d,[(25+q,72),(32+q,70),(37,67)],'#779776');line(d,[(32+q,48),(31+q,61)],'#5a967a')
 line(d,[(46+k,38),(48,54),(43,68)],'#1b333c',2);line(d,[(48,67),(43,72)],'#5b7d69')
 for x,y in [(26+q,70),(30+q,69),(34+q,67)]:box(d,(x,y,x+1,y),GOLD)
 for x,y,off,col in [(41,64,s,'#536363'),(53,64,-s,'#647471')]:
  limb(d,[(x,y),(x+off//2,74),(x+off-2,81)],col,5,'#859080')
  poly(d,[(x+off-5,79),(x+off+3,79),(x+off+4,84),(x+off-8,84),(x+off-8,82)],INK)
  box(d,(x+off-5,80,x+off+2,82),'#4f5b59');line(d,[(x+off-5,80),(x+off+1,80)],'#9b9b7c');box(d,(x+off-7,83,x+off+2,83),'#727b6b')
 # Scaled cuirass, moon clasp, belt buckle and travel pouches.
 poly(d,[(38+k,35+b),(51+k,33+b),(59+k,42+b),(55+k,61),(43+k,65),(34+k,56),(33+k,43)],INK)
 poly(d,[(39+k,37+b),(51+k,36+b),(55+k,43+b),(52+k,58),(43+k,60),(37+k,54),(36+k,43)],'#526864')
 poly(d,[(39+k,40),(49+k,38),(53+k,42),(50+k,51),(40+k,52)],'#718378')
 for y in [43,47,51]:line(d,[(40+k,y),(44+k,y+1),(48+k,y)],'#a0a68c')
 line(d,[(38+k,40),(37+k,50),(41+k,55)],'#334a4e',2);line(d,[(52+k,42),(50+k,55)],'#3a514f')
 line(d,[(36+k,58),(54+k,59)],'#897047',4);box(d,(44+k,57,48+k,61),GOLD);box(d,(45+k,58,47+k,60),'#ead39a')
 box(d,(36+k,59,41+k,65),'#655840');line(d,[(37+k,60),(40+k,60)],'#ac9361');box(d,(52+k,59,56+k,64),'#4a5348')
 diamond(d,47+k,36+b,3,GOLD);diamond(d,47+k,36+b,1,IVORY)
 # Arms articulate independently of the cloak and feet.
 lh=(32-s//2,53+b) if a<0 else [(30,49),(40,39),(53,38),(39,49)][a]
 rh=(61+s//2,53+b) if a<0 else [(56,42),(66,43),(76,47),(65,51)][a]
 limb(d,[(37+k,40+b),(30+k,45+b),lh],'#5c7569',5,'#b0b7a0')
 limb(d,[(54+k,40+b),(59+k,45+b),rh],'#405c56',5,'#849985')
 for x,y in [lh,rh]:box(d,(x-2,y-1,x+2,y+3),'#a58b61');box(d,(x,y,x+2,y+1),'#d2b77f')
 poly(d,[(32+k,39),(36+k,36),(41+k,40),(38+k,44),(33+k,43)],'#8d9c83');line(d,[(34+k,39),(37+k,38)],IVORY)
 # Hood, a visible ear, silver hair locks and a single green eye.
 poly(d,[(35+k,18+b),(40+k,12+b),(49+k,10+b),(58+k,17+b),(62+k,27+b),(57+k,37+b),(43+k,39+b),(34+k,31+b),(32+k,24+b)],INK)
 poly(d,[(37+k,19+b),(41+k,15+b),(49+k,13+b),(56+k,19+b),(58+k,27+b),(54+k,34+b),(43+k,35+b),(37+k,29+b),(35+k,24+b)],'#46695c')
 poly(d,[(44+k,22+b),(54+k,21+b),(58+k,26+b),(55+k,33+b),(47+k,33+b),(43+k,29+b)],'#c8b297')
 line(d,[(51+k,31+b),(55+k,30+b)],'#8c7768');box(d,(51+k,26+b,55+k,27+b),INK);box(d,(53+k,26+b,54+k,26+b),'#bbd8a2')
 poly(d,[(36+k,24+b),(39+k,18+b),(49+k,16+b),(54+k,19+b),(49+k,23+b),(45+k,22+b),(42+k,29+b),(39+k,31+b),(40+k,24+b),(35+k,29+b)],'#bfcfc0')
 line(d,[(38+k,22+b),(42+k,18+b),(47+k,17+b)],'#f0f0d4');line(d,[(42+k,23+b),(40+k,29+b)],'#8ea99e')
 line(d,[(37+k,31+b),(33+k,35+b),(29+k,34+b)],'#c2d1bc',2);line(d,[(40+k,15+b),(48+k,12+b),(56+k,18+b)],'#9da882')
 box(d,(56+k,21+b,57+k,23+b),GOLD)
 # Crescent follows the wrist through preparation, release and recovery.
 hx,hy=rh;cy=hy+8
 poly(d,[(hx+4,cy-13),(hx+11,cy-7),(hx+12,cy+3),(hx+8,cy+13),(hx,cy+18),(hx-10,cy+17),(hx-14,cy+12),(hx-6,cy+13),(hx+2,cy+8),(hx+5,cy)],INK)
 poly(d,[(hx+5,cy-9),(hx+9,cy-5),(hx+9,cy+3),(hx+5,cy+11),(hx-1,cy+15),(hx-9,cy+14),(hx-4,cy+12),(hx+3,cy+6),(hx+6,cy)],'#becfaf')
 line(d,[(hx+7,cy-5),(hx+7,cy+3),(hx+3,cy+10),(hx-2,cy+13)],'#eff0cb',2);diamond(d,hx,hy+1,3,GOLD);box(d,(hx,hy,hx+1,hy+1),'#f3e3ad')
 if a==2:diamond(d,lh[0]+2,lh[1]-3,4,'#68bfa8');diamond(d,lh[0]+2,lh[1]-3,2,'#e0efc9')
 return im

def skeleton(frame):
 im=Image.new('RGBA',(CELL,CELL));d=ImageDraw.Draw(im);p=pose(frame);s=p['step'];b=p['bob'];k=p['lean'];a=p['attack']
 poly(d,[(33+k,37),(29,48),(31,66),(38,62),(44,69),(49,63),(58,68),(64,59),(60+k,38)],INK)
 poly(d,[(35+k,39),(32,49),(34,62),(39,58),(44,64),(49,59),(57,63),(60,57),(57+k,40)],'#3c4844')
 line(d,[(34,52),(35,61)],'#667465');line(d,[(55,48),(58,59)],'#1f3439',2)
 for x,off,col in [(40,s,BONE),(54,-s,'#929e8b')]:
  limb(d,[(x,63),(x+off,74),(x+off-2,82)],col,3,IVORY);diamond(d,x+off,74,2,'#a3aa91');line(d,[(x+off-2,82),(x+off-8,84)],col,3)
  for z in range(3):box(d,(x+off-8+z*2,83,x+off-8+z*2,85),'#d4d6b4')
 lh=(27-s,61+b);rh=(67+s,58+b) if a<0 else [(61,33),(70,38),(81,48),(70,57)][a]
 for shoulder,elbow,hand in [((34+k,40),(27,47),lh),((60+k,40),(65+k,47),rh)]:
  limb(d,[shoulder,elbow,hand],BONE,3,IVORY);diamond(d,*elbow,2,'#a2aa90');line(d,[(hand[0]-2,hand[1]),(hand[0]+3,hand[1]+3)],'#cbd0b0',2)
 # Jagged iron knife and frayed shoulder straps.
 hx,hy=rh;poly(d,[(hx,hy-2),(hx+4,hy-17),(hx+7,hy-20),(hx+6,hy-5),(hx+3,hy+3)],INK);poly(d,[(hx+2,hy-4),(hx+5,hy-16),(hx+5,hy-7)],'#9ca891');line(d,[(hx+2,hy-8),(hx+4,hy-15)],'#e5e0c0');line(d,[(hx-2,hy),(hx+6,hy+1)],'#9c7756',2)
 line(d,[(39+k,38),(37+k,49)],'#8b7353',3);line(d,[(54+k,39),(57+k,50)],'#8b7353',3)
 # Six exposed ribs, spine nodes, hip girdle, chipped jaw.
 line(d,[(47+k,39),(46+k,60)],'#b8bea1',3)
 for y in [44,49,54]:
  line(d,[(38+k,y),(41+k,y+2),(46+k,y+1)],'#d7d7b4',2);line(d,[(47+k,y+1),(53+k,y+2),(57+k,y)],'#a5b194',2)
 for y in [41,47,53,59]:box(d,(46+k,y,48+k,y+1),'#e3e1bf')
 poly(d,[(38,61),(46,63),(56,60),(53,66),(48,66),(45,68),(40,66)],'#aab69a');box(d,(44,63,48,65),INK)
 poly(d,[(35+k,18+b),(42+k,12+b),(52+k,13+b),(61+k,22+b),(60+k,31+b),(55+k,38+b),(42+k,39+b),(34+k,30+b)],INK)
 poly(d,[(37+k,19+b),(43+k,15+b),(51+k,16+b),(58+k,23+b),(57+k,31+b),(53+k,35+b),(43+k,36+b),(37+k,29+b)],BONE)
 poly(d,[(38+k,19+b),(45+k,16+b),(51+k,17+b),(53+k,21+b),(41+k,22+b)],'#e5e2bf');line(d,[(48+k,16+b),(47+k,20+b),(51+k,23+b)],'#7c8b7d')
 box(d,(38+k,24+b,44+k,29+b),INK);box(d,(51+k,24+b,57+k,29+b),INK);box(d,(41+k,25+b,42+k,26+b),'#b9d095');box(d,(54+k,25+b,55+k,26+b),'#c8da9c')
 poly(d,[(47+k,29+b),(44+k,33+b),(48+k,33+b)],'#52695d');line(d,[(42+k,34+b),(54+k,34+b)],'#73856f')
 for x in [43,47,51]:line(d,[(x+k,34+b),(x+k,37+b)],INK)
 box(d,(34+k,37,39+k,39),'#7c7052');box(d,(56+k,36,61+k,39),'#665e49')
 return im

def wraith(frame):
 im=Image.new('RGBA',(CELL,CELL));d=ImageDraw.Draw(im);p=pose(frame);a=p['attack'];q=p['sway'];b=p['bob'];k=p['lean']
 poly(d,[(43+k,10+b),(53+k,12+b),(63+k,24+b),(64+k,39),(73,49),(68,59),(63,55),(63+q,70),(55+q,77),(51-q,88),(45,81),(38+q,88),(34,75),(26,72),(29,58),(20,62),(18,55),(30,42),(33,24)],'#14343d')
 poly(d,[(43+k,14+b),(52+k,16+b),(59+k,26+b),(60+k,42),(67,50),(63,57),(59,54),(58+q,69),(51+q,75),(48-q,83),(44,76),(39+q,81),(38,71),(31,68),(35,55),(25,58),(24,54),(35,41),(36,26)],'#2e6968')
 poly(d,[(44+k,17+b),(51+k,19+b),(55+k,28+b),(53+k,43),(48,51),(54+q,60),(49+q,72),(43,78),(46,65),(40,55),(43,41),(39,30)],'#5aab95')
 line(d,[(40+k,24+b),(45+k,17+b),(51+k,19+b)],'#a8cfb0',2)
 # Spectral folded hood and two luminous recessed eyes.
 poly(d,[(41+k,26+b),(51+k,25+b),(58+k,32+b),(54+k,42+b),(41+k,43+b),(36+k,36+b)],INK)
 line(d,[(38+k,30+b),(43+k,27+b),(51+k,26+b)],'#a6d2b7')
 for x,y in [(40+k,34+b),(51+k,33+b)]:box(d,(x,y,x+4,y+3),'#6cc6ba');box(d,(x+1,y,x+3,y+1),'#e4f2cb')
 line(d,[(43+k,44+b),(48+k,47+b),(52+k,43+b)],'#28545a')
 # Cloth threads and smoke ribbons move independently during a lunge.
 lh=(29-q,59+b) if a<0 else [(30,52),(24,48),(19,48),(26,57)][a];rh=(65+q,55+b) if a<0 else [(65,44),(74,42),(82,47),(72,54)][a]
 for shoulder,hand in [((36+k,43),lh),((58+k,42),rh)]:
  line(d,[shoulder,(hand[0]-2,hand[1]-6),hand],'#467f78',4);line(d,[(hand[0]-1,hand[1]-3),(hand[0]+3,hand[1]+3)],'#a1cfb3',2)
  for j in range(3):line(d,[(hand[0]+j*2,hand[1]),(hand[0]+j*2-1,hand[1]+6)],'#90c9ae')
 for x,y in [(37+q,65),(49+q,69),(52-q,77)]:line(d,[(x,y),(x-3,y+5),(x-2,y+9)],'#99ccb0')
 for x,y in [(27,28),(68,33),(25+q,76)]:box(d,(x,y,x+1,y+2),'#5d9f8c')
 if a==2:line(d,[(56,46),(66,50),(73,58)],'#b4e1c3',2)
 return im

def bat(frame):
 im=Image.new('RGBA',(CELL,CELL));d=ImageDraw.Draw(im);p=pose(frame);a=p['attack']
 # A genuine six-pose wingbeat: shoulders, knuckles and tips each articulate.
 phase=frame*5 if frame<2 else frame-2 if frame<8 else [1,3,4,1][a]
 tips=[(5,23),(9,37),(20,56),(27,65),(15,48),(7,29)];tx,ty=tips[phase];bob=[0,1,2,1,0,-1][phase]
 for flip in [False,True]:
  def pts(values):return [(96-x if flip else x,y+bob) for x,y in values]
  poly(d,pts([(42,43),(32,34),(tx,ty),(tx+2,ty+13),(max(7,tx-2),ty+20),(tx+7,ty+17),(tx+11,ty+28),(tx+17,ty+23),(34,64),(43,56)]),INK)
  poly(d,pts([(41,44),(32,38),(tx+4,ty+5),(tx+6,ty+16),(tx+10,ty+15),(tx+13,ty+23),(tx+18,ty+20),(34,59),(41,54)]),'#604255')
  line(d,pts([(40,46),(32,40),(tx+5,ty+7)]),'#b0808a',2);line(d,pts([(32,41),(tx+13,ty+22)]),'#8f5d77');line(d,pts([(35,44),(34,57)]),'#9a7188')
  for x,y in [(31,44),(34,49),(38,52)]:box(d,(96-x if flip else x,y+bob,96-x+1 if flip else x+1,y+bob+1),'#c0939c')
 poly(d,[(39,34+bob),(42,24+bob),(47,34+bob),(50,34+bob),(56,24+bob),(58,40+bob),(60,52+bob),(54,65+bob),(42,64+bob),(36,52+bob)],INK)
 poly(d,[(41,38+bob),(44,29+bob),(47,38+bob),(51,38+bob),(54,30+bob),(55,42+bob),(57,52+bob),(52,60+bob),(44,60+bob),(39,51+bob)],'#70576a')
 poly(d,[(43,44+bob),(50,41+bob),(54,46+bob),(52,57+bob),(47,60+bob),(42,55+bob)],'#977686')
 line(d,[(42,43+bob),(45,40+bob),(49,41+bob)],'#b19699');box(d,(41,43+bob,45,45+bob),'#df9b83');box(d,(52,43+bob,55,45+bob),'#df9b83')
 box(d,(43,43+bob,44,43+bob),'#fff0b6');box(d,(53,43+bob,54,43+bob),'#fff0b6');poly(d,[(46,48+bob),(51,48+bob),(49,51+bob)],INK)
 for x in [44,52]:poly(d,[(x,51+bob),(x+2,51+bob),(x+1,56+bob)],'#f2e6bf')
 for x in [44,53]:line(d,[(x,61+bob),(x-1,66+bob),(x-3,67+bob)],'#c1b4a0',2)
 line(d,[(48,63+bob),(49,69+bob),(45,72+bob)],'#72566b',2)
 return im

def king(frame):
 im=Image.new('RGBA',(CELL,CELL));d=ImageDraw.Draw(im);p=pose(frame);s=p['step'];b=p['bob'];k=p['lean'];a=p['attack']
 # Broad antler crown with chips and moss, attached to the skull, not the mantle.
 branches=[[(39+k,31+b),(28+k,22+b),(22+k,10+b),(17+k,7+b)],[(29+k,23+b),(16+k,20+b),(10+k,12+b)],[(23+k,13+b),(28+k,6+b)],[(55+k,31+b),(66+k,22+b),(73+k,9+b),(80+k,6+b)],[(65+k,23+b),(80+k,20+b),(86+k,12+b)],[(72+k,13+b),(66+k,6+b)]]
 for points in branches:limb(d,points,'#819077',3,'#b9bc91')
 for x,y in [(22+k,13+b),(75+k,13+b),(29+k,22+b)]:box(d,(x,y,x+2,y+1),'#547a5e')
 # Roots take heavy alternating steps; bark armor separates plate by plate.
 for x,off in [(36,s),(60,-s)]:
  limb(d,[(x,66),(x+off,77),(x+off-3,84)],'#596d55',6,'#a1a887');line(d,[(x+off,80),(x+off+6,85)],'#7c876a',3);line(d,[(x+off-2,82),(x+off-8,85)],'#9a9f79',2)
 poly(d,[(36+k,32),(25,35),(16,48),(22,57),(18,67),(32,64),(33,76),(43,72),(48,84),(54,73),(65,78),(64,65),(79,69),(73,56),(81,49),(69,37),(58+k,32)],INK)
 poly(d,[(37+k,36),(28,39),(22,48),(28,56),(24,63),(36,59),(37,70),(43,66),(48,76),(54,66),(60,72),(59,60),(72,64),(67,55),(74,49),(65,41),(57+k,36)],'#36574a')
 for x,y,flip in [(28,42,1),(62,42,-1),(34,56,1),(58,58,-1)]:
  poly(d,[(x,y),(x+flip*8,y+3),(x+flip*3,y+12),(x-flip*2,y+8)],'#708363');line(d,[(x,y+2),(x+flip*4,y+4),(x+flip*2,y+9)],'#acaf7d')
 lh=(22-s,61) if a<0 else [(24,48),(19,48),(13,57),(21,63)][a];rh=(74+s,58) if a<0 else [(69,34),(80,40),(85,54),(77,61)][a]
 for shoulder,elbow,hand in [((28,42),(23,51),lh),((66,42),(72,49),rh)]:
  limb(d,[shoulder,elbow,hand],'#657c5f',6,'#b0b48c');line(d,[(hand[0]-1,hand[1]),(hand[0]-5,hand[1]+7)],'#bbb99a',2);line(d,[(hand[0]+2,hand[1]),(hand[0]+5,hand[1]+8)],'#969b7a',2)
 poly(d,[(36+k,40),(45+k,35),(57+k,40),(61+k,53),(55+k,65),(45+k,68),(36+k,57),(33+k,48)],INK)
 poly(d,[(41+k,42),(50+k,39),(56+k,44),(56+k,54),(50+k,62),(43+k,61),(38+k,51)],'#28645b')
 diamond(d,48+k,50,9,'#4b957d');diamond(d,48+k,49,6,'#a6d7b7');diamond(d,48+k,48,3,'#e4edc9')
 for points in [[(36+k,43),(39+k,58),(45+k,64)],[(59+k,43),(57+k,58),(51+k,64)]]:limb(d,points,'#8a9a80',2,'#c3c8a5')
 # Deer-skull plates, carved nose, eye sockets and tiny spectral fissures.
 poly(d,[(36+k,25+b),(42+k,20+b),(52+k,21+b),(61+k,28+b),(58+k,38+b),(53+k,45+b),(41+k,42+b),(34+k,33+b)],INK)
 poly(d,[(39+k,26+b),(44+k,23+b),(51+k,24+b),(57+k,29+b),(54+k,36+b),(50+k,41+b),(43+k,38+b),(38+k,32+b)],BONE)
 line(d,[(41+k,26+b),(46+k,24+b),(51+k,26+b)],'#eee7c4');box(d,(39+k,28+b,44+k,32+b),INK);box(d,(51+k,28+b,57+k,32+b),INK)
 box(d,(41+k,29+b,43+k,30+b),'#8ec9a5');box(d,(53+k,29+b,55+k,30+b),'#8ec9a5');poly(d,[(47+k,32+b),(44+k,37+b),(50+k,38+b)],'#6f8470')
 line(d,[(49+k,24+b),(47+k,28+b)],'#7a8f78');line(d,[(43+k,38+b),(50+k,40+b)],'#87977d')
 return im

def warden(frame):
 im=Image.new('RGBA',(CELL,CELL));d=ImageDraw.Draw(im);p=pose(frame);s=p['step'];b=p['bob'];k=p['lean'];a=p['attack']
 # Elite has a compact broken crown, pale iron mail and a plum tabard.
 poly(d,[(35,40),(26,48),(24,69),(34,65),(38,80),(47,74),(55,80),(67,71),(65,48),(57,40)],INK)
 poly(d,[(36,44),(30,49),(29,65),(37,61),(41,73),(47,69),(54,74),(61,68),(60,48),(55,44)],'#51495f')
 line(d,[(35,49),(34,64),(41,70)],'#a69b9b');line(d,[(55,48),(57,66)],'#322f44',2)
 for x,off in [(40,s),(55,-s)]:
  limb(d,[(x,67),(x+off,76),(x+off,83)],'#7a8380',5,'#c8c6a8');box(d,(x+off-5,81,x+off+3,85),'#4f5b61');line(d,[(x+off-5,81),(x+off+2,81)],'#b9bb9e')
 poly(d,[(34+k,41),(45+k,37),(59+k,42),(61+k,56),(54+k,65),(42+k,64),(32+k,54)],'#263844')
 poly(d,[(36+k,43),(45+k,40),(56+k,44),(57+k,55),(51+k,60),(42+k,59),(35+k,52)],'#79877e')
 for y in [46,50,54]:line(d,[(38+k,y),(43+k,y+2),(50+k,y)],'#c5c4a5')
 diamond(d,48+k,49,5,'#61516e');diamond(d,48+k,49,3,'#c3add8');diamond(d,48+k,48,1,'#f1e2c8')
 # One shielded arm, one hooked poleaxe; each has a distinct swing.
 lh=(27-s//2,58);rh=(66+s//2,54) if a<0 else [(63,37),(72,37),(80,48),(70,55)][a]
 limb(d,[(34+k,44),(29,50),lh],'#7d8d81',5,'#c7c7aa');limb(d,[(60+k,44),(64+k,49),rh],'#758779',5,'#c7c7aa')
 hx,hy=rh;limb(d,[(hx-2,hy+18),(hx+3,hy-21)],'#887653',3,'#c0aa78')
 poly(d,[(hx+2,hy-24),(hx+12,hy-24),(hx+14,hy-16),(hx+9,hy-9),(hx+5,hy-12),(hx+5,hy-17),(hx-3,hy-17)],INK)
 poly(d,[(hx+4,hy-22),(hx+10,hy-22),(hx+11,hy-16),(hx+8,hy-12),(hx+6,hy-17),(hx,hy-19)],'#a2b09d');line(d,[(hx+9,hy-22),(hx+11,hy-16),(hx+8,hy-12)],'#e3e0bd')
 sx,sy=lh;poly(d,[(sx-8,sy-10),(sx+7,sy-9),(sx+9,sy+6),(sx,sy+15),(sx-10,sy+6)],INK);poly(d,[(sx-6,sy-8),(sx+5,sy-7),(sx+6,sy+5),(sx,sy+11),(sx-7,sy+5)],'#738378');line(d,[(sx-5,sy-6),(sx+4,sy-5)],'#c6bc94');diamond(d,sx,sy+1,4,'#4b5860');diamond(d,sx,sy+1,2,'#ba9e71')
 # Slit helm with chipped antlers and a hanging gold seal.
 for points in [[(39+k,26+b),(32+k,17+b),(33+k,10+b)],[(55+k,26+b),(65+k,18+b),(65+k,13+b)]]:limb(d,points,'#8d9c82',3,'#c8c8a4')
 poly(d,[(36+k,24+b),(43+k,18+b),(53+k,19+b),(61+k,27+b),(59+k,38+b),(53+k,44+b),(40+k,40+b),(34+k,33+b)],INK)
 poly(d,[(39+k,25+b),(44+k,21+b),(52+k,22+b),(57+k,28+b),(55+k,36+b),(50+k,40+b),(42+k,37+b),(38+k,32+b)],'#91a08e')
 line(d,[(41+k,25+b),(47+k,22+b),(53+k,25+b)],'#e1ddbc');box(d,(38+k,28+b,56+k,32+b),'#293544');box(d,(40+k,29+b,44+k,30+b),'#d0b4d5');box(d,(51+k,29+b,55+k,30+b),'#d0b4d5')
 line(d,[(47+k,24+b),(47+k,37+b)],'#bfbea0');box(d,(44+k,37+b,50+k,38+b),'#647567');diamond(d,47+k,40+b,2,GOLD)
 return im

DRAWERS=[wanderer,skeleton,wraith,bat,king,warden]
def generate(out):
 out=Path(out);out.mkdir(parents=True,exist_ok=True);sheet=Image.new('RGBA',(CELL*12,CELL*6));tiles=[]
 for row,draw in enumerate(DRAWERS):
  frames=[]
  for frame in range(12):
   im=draw(frame);bounds=im.getbbox()
   if not bounds or bounds[0]<1 or bounds[1]<1 or bounds[2]>CELL-1 or bounds[3]>CELL-1:raise ValueError(f'Clipped {ROWS[row]} frame {frame}: {bounds}')
   sheet.paste(im,(frame*CELL,row*CELL));frames.append(im)
  tiles.append(frames)
 sheet.save(out/'pixel-actors.png',optimize=True)
 # Update the static UI portraits and the legacy walking fallback from the same art.
 legacy=Image.open(out/'pixel-sprites.png').convert('RGBA')
 for row in range(5):legacy.paste((0,0,0,0),((row%4)*64,(row//4)*64,(row%4+1)*64,(row//4+1)*64));legacy.paste(tiles[row][0].resize((64,64),Image.Resampling.NEAREST),((row%4)*64,(row//4)*64))
 legacy.save(out/'pixel-sprites.png',optimize=True)
 walk=Image.new('RGBA',(384,96))
 for j,frame in enumerate([2,3,5,6]):walk.paste(tiles[0][frame],(j*96,0))
 walk.save(out/'pixel-walk.png',optimize=True)
 review=Image.new('RGB',(CELL*4*2,CELL*6*2),'#17232d')
 for row in range(6):
  for column,frame in enumerate([0,3,6,10]):
   tile=tiles[row][frame].resize((192,192),Image.Resampling.NEAREST);review.paste(tile,(column*192,row*192),tile)
 review.save(out/'pixel-actors-preview.png',optimize=True)
 # A shareable animation contact sheet: all six silhouettes on one dark ground.
 gif_frames=[]
 for frame in list(range(2,8))*2+[8,9,10,11,0,1]:
  board=Image.new('RGB',(CELL*6*2,CELL*2),'#17232d')
  for row in range(6):
   tile=tiles[row][frame].resize((192,192),Image.Resampling.NEAREST);board.paste(tile,(row*192,0),tile)
  gif_frames.append(board)
 gif_frames[0].save(out/'pixel-actors-motion.gif',save_all=True,append_images=gif_frames[1:],duration=105,loop=0,optimize=False,disposal=2)
 return sheet
if __name__=='__main__':generate(Path(__file__).resolve().parents[1]/'public'/'art')
