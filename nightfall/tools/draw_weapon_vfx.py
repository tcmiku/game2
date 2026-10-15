"""Eight native pixel frames per effect. No smoothing, blur, or generated images."""
from pathlib import Path
from PIL import Image, ImageDraw
import math
CELL=96
ROWS=['crescent','thrust','flame','frost','arc','rune','burst','wind','spark','raven','slash','smoke']
def frame(kind,f):
 im=Image.new('RGBA',(CELL,CELL));d=ImageDraw.Draw(im);t=f/7;phase=f*math.tau/8
 def p(x,y):return round(x),round(y)
 def line(points,c,w=1):d.line([p(*q) for q in points],fill=c,width=w)
 def poly(points,c):d.polygon([p(*q) for q in points],fill=c)
 def dot(x,y,c,size=2):x,y=p(x,y);d.rectangle((x,y,x+size-1,y+size-1),fill=c)
 def diamond(x,y,r,c):poly([(x,y-r),(x+r,y),(x,y+r),(x-r,y)],c)
 def ring(x,y,r,c,w=1):d.ellipse((round(x-r),round(y-r),round(x+r),round(y+r)),outline=c,width=w)
 def star(x,y,r,c):line([(x-r,y),(x+r,y)],c);line([(x,y-r),(x,y+r)],c)
 if kind=='crescent':
  for a0,r,c,w in [(-2.3,31,(113,160,148,60),10),(-2.1,29,'#588d8e',6),(-1.9,28,'#b0dbcf',4),(-1.8,29,'#eff3cf',2)]:
   line([(48+math.cos(a)*r,48+math.sin(a)*r) for a in [a0+i*3.6/24 for i in range(25)]],c,w)
  poly([(45,20),(66,24),(76,39),(65,29),(52,26)],'#eff3cf')
  for i in range(4):
   a=phase+i*1.4;dot(48+math.cos(a)*35,48+math.sin(a)*35,'#bad9be',2 if i%2 else 1)
 elif kind=='thrust':
  poly([(10,44),(62,44),(81,48),(62,52),(10,52),(27,48)],(219,180,107,80))
  poly([(22,46),(66,45),(86,48),(66,51),(22,50),(35,48)],'#c9ae76');line([(35,48),(81,48)],'#fff1c3',3)
  for i in range(4):dot(14+i*10,40+(f+i)%4*4,'#dfcea2',2)
 elif kind=='flame':
  # Five tongues, each with a separate eight-frame lick and a hot inner core.
  for i in range(5):
   x=24+i*12;h=19+(i*13+f*7)%24;y=69+(i%2)*5
   poly([(x-9,y),(x-11,y-10),(x-3,y-h),(x+1,y-h-10),(x+6,y-17),(x+10,y-8),(x+7,y)],(111,71,54,115))
   poly([(x-7,y-2),(x-7,y-13),(x-1,y-h-4),(x+3,y-20),(x+7,y-9),(x+4,y-1)],'#cf7850')
   poly([(x-3,y-3),(x-4,y-13),(x+1,y-26),(x+4,y-12),(x+3,y-3)],'#edb36b');diamond(x,y-9,3,'#ffe1a0')
   dot(x+math.sin(phase+i)*6,y-42-(f*4+i*7)%17,'#e9bd76',2)
 elif kind=='frost':
  r=9+t*33;ring(48,48,r,(132,203,211,round(120*(1-t)+25)),2)
  for i in range(10):
   a=i*math.tau/10+.12;rr=r*(.8 if i%2 else 1);x=48+math.cos(a)*rr;y=48+math.sin(a)*rr
   tip=(x+math.cos(a)*(5+4*(1-t)),y+math.sin(a)*(5+4*(1-t)))
   poly([(x-math.sin(a)*3,y+math.cos(a)*3),tip,(x+math.sin(a)*3,y-math.cos(a)*3),(x-math.cos(a)*5,y-math.sin(a)*5)],'#92ccdc')
   line([(x-math.cos(a)*4,y-math.sin(a)*4),tip],'#edf9e3',1)
   if i%2==0:star(x-math.cos(a)*10,y-math.sin(a)*10,2,'#b6e6df')
  if f<3:diamond(48,48,10-f*3,'#eff9df')
 elif kind=='arc':
  for i in range(6):
   a=i*math.tau/6;r=13+t*25;points=[]
   for k in range(5):
    rr=r*k/4;aa=a+(.16 if (k+f)%2 else -.16);points.append((48+math.cos(aa)*rr,48+math.sin(aa)*rr))
   line(points,(144,132,202,75),5);line(points,'#bcb6e8',2)
   if i%2==0:line(points[:3],'#f6eccd',1)
  if f<5:diamond(48,48,max(2,9-f),'#e8e8e0')
 elif kind=='rune':
  ring(48,48,34,'#694e83',2);ring(48,48,31,'#cba7d9');ring(48,48,22,(188,156,211,120))
  for n in [3,4]:
   points=[(48+math.cos(phase*.15+i*math.tau/n-math.pi/2)*25,48+math.sin(phase*.15+i*math.tau/n-math.pi/2)*25) for i in range(n)]
   line(points+[points[0]],'#a68ac4')
  for i in range(8):
   a=i*math.tau/8; x=48+math.cos(a)*38;y=48+math.sin(a)*38;diamond(x,y,2,'#e5c4df' if i%3==f%3 else '#9977a8')
  diamond(48,48,7,'#715583');diamond(48,48,3,'#eccee7')
 elif kind=='burst':
  r=8+t*32;ring(48,48,r,(229,170,96,round(180*(1-t))),3 if f<4 else 1)
  for i in range(9):
   a=i*math.tau/9+.3;rr=r*(.75+(i%3)*.1);x=48+math.cos(a)*rr;y=48+math.sin(a)*rr
   diamond(x,y,max(1,round((1-t)*7)),'#e3a369');diamond(x,y,max(1,round((1-t)*3)),'#ffdf9c')
   line([(x,y),(x-math.cos(a)*8*(1-t),y-math.sin(a)*8*(1-t))],'#f6d291',2)
  if f<4:diamond(48,48,17-f*3,'#f7d59a');diamond(48,48,10-f*2,'#fff3ce')
 elif kind=='wind':
  for j in range(6):
   r=9+j*5;y=74-j*8;x=48+math.sin(phase+j*.7)*4
   d.arc((round(x-r),round(y-r*.27),round(x+r),round(y+r*.27)),20+f*45,285+f*45,fill='#9ecdb4' if j%2 else '#d4e5c4',width=2)
   a=phase+j*.8;dot(x+math.cos(a)*r,y+math.sin(a)*r*.27,'#eef3cf',2)
  for i in range(5):
   a=phase+i*1.7;dot(48+math.cos(a)*33,30+i*9,'#a6b896',2)
 elif kind=='spark':
  for i in range(8):
   a=i*math.tau/8+.1;r=5+t*32;rr=5+6*(1-t);x=48+math.cos(a)*r;y=48+math.sin(a)*r
   line([(x,y),(x+math.cos(a)*rr,y+math.sin(a)*rr)],'#e5c48a',2 if f<4 else 1)
   if i%2==0:dot(x,y,'#fff0c4',2)
  if f<4:star(48,48,10-f*2,'#fff2c9');diamond(48,48,4,'#e4cca1')
 elif kind=='raven':
  lift=[-15,-23,-14,-2,9,14,5,-6][f]
  # Wing fingers and light leading edges remain readable at small battle size.
  for side in [-1,1]:
   poly([(48,45),(48+side*16,34+lift*.4),(48+side*39,30+lift),(48+side*35,46+lift),(48+side*25,55+lift*.5),(48+side*10,54)],'#182334')
   poly([(48,45),(48+side*17,38+lift*.4),(48+side*35,33+lift),(48+side*30,45+lift),(48+side*17,50+lift*.5)],'#566d9b')
   line([(48+side*11,43),(48+side*30,36+lift)],'#acbce1',2)
   for k in [0,1,2]:line([(48+side*(18+k*6),43+lift*.6),(48+side*(17+k*6),50+lift*.6)],'#879ac5')
  poly([(42,40),(49,33),(54,39),(56,54),(51,60),(55,72),(47,67),(40,72),(43,57),(39,51)],'#182334')
  poly([(44,41),(49,37),(52,41),(53,53),(48,58),(43,52)],'#7689b2');dot(50,41,'#f6d69b',2);poly([(53,42),(60,45),(53,46)],'#d3bb88')
 elif kind=='slash':
  start=-1.15;end=-1.1+t*2.25
  for r,c,w in [(35,(116,97,155,60),12),(34,'#8879ab',7),(35,'#c9b7df',4),(36,'#f3e2dc',2)]:
   line([(48+math.cos(start+(end-start)*i/32)*r,48+math.sin(start+(end-start)*i/32)*r) for i in range(33)],c,w)
  diamond(48+math.cos(end)*36,48+math.sin(end)*36,3,'#fff0cd')
 elif kind=='smoke':
  for i in range(6):
   a=i*2.4;rr=7+t*22;x=48+math.cos(a)*rr;y=53+math.sin(a)*rr*.4-t*17;r=max(2,round(9*(1-t)))
   d.rectangle((round(x-r),round(y-r),round(x+r),round(y+r)),fill=(124,131,132,round(65*(1-t))))
 return im

def generate(out):
 out=Path(out);out.mkdir(parents=True,exist_ok=True);sheet=Image.new('RGBA',(CELL*8,CELL*len(ROWS)))
 for row,kind in enumerate(ROWS):
  for f in range(8):
   tile=frame(kind,f);assert tile.getbbox() or f==7,(kind,f);sheet.paste(tile,(f*CELL,row*CELL))
 sheet.save(out/'pixel-weapon-vfx.png',optimize=True)
 review=Image.new('RGB',(CELL*8,CELL*len(ROWS)),'#17232b');review.paste(sheet,(0,0),sheet);review.save(out/'pixel-weapon-vfx-preview.png',optimize=True)
 # A compact animated art review; the game uses the PNG atlas.
 frames=[]
 for f in range(8):
  contact=Image.new('RGB',(384,288),'#17232b')
  for row,kind in enumerate(ROWS):
   tile=frame(kind,f);contact.paste(tile,((row%4)*96,(row//4)*96),tile)
  frames.append(contact.resize((768,576),Image.Resampling.NEAREST))
 frames[0].save(out/'pixel-weapon-vfx-motion.gif',save_all=True,append_images=frames[1:],duration=85,loop=0,disposal=2)
if __name__=='__main__':generate(Path(__file__).resolve().parents[1]/'public/art')
