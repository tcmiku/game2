"""Native pixel sprites and appended icons; preserve every existing atlas pixel."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
INK='#101c29'; SILVER='#cbd8d7'; HI='#f1eee0'; SHADE='#778f9e'; RED='#a9474d'; GOLD='#e8d194'
def egg(charge=False):
 im=Image.new('RGBA',(128,128));d=ImageDraw.Draw(im)
 pts=[(63,39),(75,43),(84,55),(89,72),(87,85),(77,96),(53,97),(41,88),(38,75),(42,58),(51,45)]
 d.polygon(pts,fill=INK);d.polygon([(63,42),(74,47),(82,58),(86,74),(82,87),(74,93),(54,94),(44,86),(42,75),(46,59),(54,48)],fill='#4c3b42')
 mask=im.getchannel('A')
 for y in range(48,90,8):
  for x in range(46,82,10):
   if (x-64)**2/470+(y-72)**2/720<.8:
    offset=4 if y%16 else 0;xx=x+offset
    d.polygon([(xx,y),(xx+5,y-3),(xx+9,y),(xx+7,y+5),(xx+3,y+5)],fill='#755356' if xx<62 else '#49333d',outline='#2b2b35')
 d.line([(63,44),(57,50),(55,59)],fill='#b28c70',width=2);d.line([(46,67),(44,77),(48,86)],fill='#987661',width=2)
 im.putalpha(mask)
 if charge:
  d.line([(67,46),(62,58),(70,64),(62,77),(69,87)],fill='#c38665',width=2)
  d.line([(20,69),(33,69)],fill='#c0a68a',width=2);d.line([(15,80),(30,80)],fill='#705d53',width=2)
 return im

def dragon(frame=0):
 im=Image.new('RGBA',(128,128));d=ImageDraw.Draw(im);lift=frame%2*10
 # Broad leather wing membranes; two hind legs and wing arms form a wyvern.
 d.polygon([(54,70),(23,32-lift),(8,16),(11,52),(25,48),(21,71),(38,61),(35,84),(58,78)],fill=INK)
 d.polygon([(53,67),(24,34-lift),(12,23),(15,47),(28,44),(27,63),(39,56),(40,75)],fill='#6d3945')
 d.polygon([(55,68),(79,25+lift),(106,10),(102,38),(118,39),(99,54),(113,66),(87,69),(78,84)],fill=INK)
 d.polygon([(60,64),(80,28+lift),(101,17),(97,41),(109,42),(93,53),(104,63),(85,65),(77,77)],fill='#82464c')
 for pts in [[(54,69),(24,35-lift),(12,24)],[(54,69),(28,44)],[(54,69),(39,56)],[(59,67),(81,29+lift),(101,17)],[(59,67),(97,41)],[(59,67),(93,53)],[(59,67),(85,65)]]:d.line(pts,fill='#ba7a63',width=2)
 # Curved serrated tail, heavy torso, long neck and angular horned head.
 d.line([(56,79),(37,87),(19,83),(9,76),(8,64)],fill=INK,width=12)
 d.line([(56,79),(37,86),(19,81),(10,75),(8,64)],fill='#44434d',width=7)
 d.polygon([(46,62),(61,55),(76,58),(85,69),(79,83),(65,91),(50,84),(44,72)],fill=INK)
 d.polygon([(49,64),(62,58),(74,61),(80,70),(75,80),(65,87),(53,80),(48,71)],fill='#55525b')
 d.polygon([(65,65),(72,48),(87,42),(96,46),(95,53),(83,57),(80,71)],fill=INK)
 d.polygon([(71,64),(76,49),(87,46),(92,48),(89,52),(79,54),(77,66)],fill='#68636a')
 d.polygon([(83,44),(94,39),(101,41),(105,48),(119,52),(118,59),(108,61),(99,58),(88,56)],fill=INK)
 d.polygon([(86,46),(96,43),(100,45),(102,51),(116,54),(115,57),(107,58),(98,54),(89,53)],fill='#64616b')
 d.polygon([(88,44),(84,33),(89,36),(95,42)],fill='#b1a38a');d.polygon([(98,41),(99,31),(104,34),(104,46)],fill='#d1b997')
 for x,y in [(41,84),(49,62),(58,57),(68,57),(78,47)]:d.polygon([(x,y),(x-3,y-7),(x+4,y-1)],fill='#aa8e7a')
 # Pebbled scales and ventral plates.
 for y in range(62,80,5):
  for x in range(51,75,6):
   if (x-63)**2/200+(y-70)**2/130<1:d.line([(x,y),(x+2,y+1),(x+4,y)],fill='#8c7b77')
 d.line([(76,64),(71,71),(70,79)],fill='#baa082',width=3)
 d.rectangle((103,47,106,49),fill='#f7b76b');d.point((106,48),fill=HI)
 claw=frame==3
 for pts in [[(55,79),(49,94),(57,100)],[(70,82),(76,94),(86,98)]]:
  if claw:pts=[(pts[0][0],pts[0][1]),(pts[1][0]+15,pts[1][1]-10),(pts[2][0]+17,pts[2][1]-8)]
  d.line(pts,fill=INK,width=8);d.line(pts,fill='#6d6266',width=4)
  x,y=pts[-1]
  for delta in [-4,0,4]:d.line([(x+delta,y-1),(x+delta+3,y+3)],fill='#d8c4a6',width=1)
 if frame==2:
  d.polygon([(103,55),(116,55),(120,61),(108,63),(100,59)],fill='#532934',outline=INK)
  for x in [106,111,116]:d.polygon([(x,55),(x+2,55),(x+1,59)],fill=HI)
  d.polygon([(116,56),(126,52),(124,59),(127,61),(117,62)],fill='#eda064');d.rectangle((120,56,125,59),fill='#ffe1a4')
 return im

def giant(frame=0):
 im=Image.new('RGBA',(128,128));d=ImageDraw.Draw(im)
 def poly(points,fill,outline=INK):d.polygon(points,fill=fill,outline=outline)
 # Feet, calves and thigh bands. Large pixels remain readable at game scale.
 sway=2 if frame==1 else -2 if frame==2 else 0
 for right in [False,True]:
  x=72 if right else 52;step=sway*(1 if right else -1)
  poly([(x-7,77),(x+7,77),(x+8,93),(x+6+step,112),(x+12+step,119),(x-8+step,120),(x-9+step,110),(x-7,94)],SHADE)
  poly([(x-5,81),(x+5,81),(x+5,94),(x+3+step,112),(x+9+step,116),(x-5+step,117),(x-6+step,110),(x-4,94)],SILVER)
  poly([(x-6,81),(x+6,81),(x+5,94),(x-3,99),(x-5,91)],RED,None)
  d.line([(x-2,101),(x-2+step,111),(x+5+step,115)],fill=HI,width=2)
 poly([(46,42),(57,38),(73,39),(83,44),(82,58),(75,78),(70,87),(55,86),(48,76),(43,57)],SHADE)
 poly([(48,44),(58,41),(71,42),(80,46),(77,60),(71,78),(67,83),(57,83),(51,74),(46,57)],SILVER)
 # The iconic red shoulders and curved chest/waist pattern.
 poly([(47,44),(54,43),(57,52),(64,57),(72,53),(75,43),(81,46),(77,61),(68,68),(65,78),(62,69),(53,62),(47,54)],RED,None)
 d.line([(52,46),(57,53),(64,57),(72,53)],fill='#c36b64',width=2)
 poly([(58,80),(64,75),(70,81),(68,86),(57,86)],RED,None)
 # Articulated arms: guard, running, crossed forearms for the ray, and punch.
 if frame==3:
  arms=[[(47,47),(42,61),(65,65),(83,62)],[(79,47),(88,53),(88,35)]]
 elif frame==4:
  arms=[[(47,47),(42,62),(52,68)],[(80,47),(95,48),(116,48)]]
 elif frame==5:
  arms=[[(47,47),(43,32),(48,15)],[(79,47),(85,64),(77,72)]]
 else:
  arms=[[(47,47),(39,58+sway),(40,75+sway)],[(79,47),(88,56-sway),(87,72-sway)]]
 for pts in arms:
  d.line(pts,fill=INK,width=13);d.line(pts,fill=SHADE,width=10);d.line([(x-1,y-1) for x,y in pts],fill=SILVER,width=7)
  x,y=pts[0];d.line([(x,y),(pts[1][0],pts[1][1])],fill=RED,width=6)
  x,y=pts[-1];d.rectangle((x-4,y-4,x+4,y+4),fill=SILVER,outline=INK);d.line([(x-2,y-2),(x+2,y-2)],fill=HI,width=1)
 # Silver helmet with dorsal crest, almond eyes and the chest color timer.
 poly([(55,17),(64,13),(74,18),(78,27),(75,38),(68,44),(59,41),(52,33),(51,24)],SHADE)
 poly([(55,20),(64,16),(72,20),(74,27),(72,36),(67,40),(59,37),(54,31)],SILVER)
 poly([(61,19),(62,7),(65,4),(68,9),(67,22),(65,31)],HI)
 d.line([(64,8),(64,27)],fill='#94a8af',width=1)
 poly([(54,25),(62,27),(61,32),(55,31),(53,28)],'#f9e6ad')
 poly([(66,27),(74,24),(75,28),(72,31),(67,32)],'#fff0b9')
 d.line([(61,35),(66,36),(70,34)],fill='#647f8e',width=1)
 d.rectangle((61,55,67,62),fill=INK);d.rectangle((62,56,66,60),fill='#79c8e2');d.rectangle((63,56,65,58),fill='#e9ffef')
 return im

def rod():
 im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
 d.polygon([(30,30),(36,30),(37,58),(28,58)],fill='#957955',outline=INK)
 d.rectangle((30,33,34,55),fill='#c3b48c');d.line([(32,36),(32,51)],fill=HI,width=1)
 for side in [-1,1]:
  d.polygon([(32,30),(32+side*20,21),(32+side*23,7),(32+side*11,10),(32+side*6,21)],fill=GOLD,outline=INK)
  d.line([(32+side*9,22),(32+side*16,15),(32+side*18,10)],fill=HI,width=2)
 d.polygon([(32,7),(39,19),(32,32),(25,19)],fill='#b9d8d9',outline=INK);d.polygon([(32,12),(35,20),(32,26),(29,20)],fill=HI)
 return im

def gene():
 im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
 d.ellipse((6,5,57,58),fill='#182d3d',outline='#7aadb8',width=2)
 left=[(22,12),(22,20),(40,32),(40,44),(23,53)];right=[(40,12),(40,20),(22,32),(22,44),(40,53)]
 d.line(left,fill='#ecdbb0',width=3);d.line(right,fill='#b4e4e8',width=3)
 for y in [15,24,33,42,50]:d.line([(24,y),(38,y)],fill='#698ca0',width=1)
 d.polygon([(32,22),(35,28),(42,31),(35,34),(32,42),(29,34),(22,31),(29,28)],fill=HI)
 return im

def main():
 out=ROOT/'public/art';old=Image.open(out/'pixel-weapons.png').convert('RGBA')
 atlas=Image.new('RGBA',(384,max(704,old.height)));atlas.paste(old,(0,0))
 icons=[egg().crop((30,35,94,99)),dragon(2).resize((64,64),Image.Resampling.NEAREST),rod(),gene(),giant(3).crop((32,4,96,68))]
 for index,icon in zip(range(72,77),icons):
  n=index-16;atlas.paste(icon,(n%6*64,n//6*64))
 # Slots 72+ were unused; every preceding occupied slot is preserved byte for byte.
 for index in range(16,72):
  n=index-16;box=(n%6*64,n//6*64,n%6*64+64,n//6*64+64)
  assert old.crop(box).tobytes()==atlas.crop(box).tobytes(),index
 atlas.save(out/'pixel-weapons.png',optimize=True);atlas.resize((768,atlas.height*2),Image.Resampling.NEAREST).save(out/'pixel-weapons-preview.png')
 actors=Image.new('RGBA',(768,256))
 for col,im in enumerate([egg(),egg(True),dragon(),dragon(1),dragon(2),dragon(3)]):actors.paste(im,(col*128,0))
 for col in range(6):actors.paste(giant(col),(col*128,128))
 actors.save(out/'pixel-dragon-light.png',optimize=True)
 preview=Image.new('RGB',(768,512),'#101e2c')
 for i,im in enumerate([egg(),dragon(2),giant(3),rod(),gene(),giant(4)]):
  im=im.resize((256,256),Image.Resampling.NEAREST);preview.paste(im,(i%3*256,i//3*256),im)
 preview.save(out/'pixel-dragon-light-preview.png')
 print('Appended icons 72–76; 128px actor atlas with 12 poses. Earlier slots preserved.')
if __name__=='__main__':main()
