"""Nine original pixel icons. Pillow geometry only; no generated image inputs."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

ROOT=Path(__file__).resolve().parents[1]
INK='#101b29'
def icon(kind):
    im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
    def p(points,c):d.polygon(points,fill=c)
    def l(points,c,w=1):d.line(points,fill=c,width=w)
    def r(box,c):d.rectangle(box,fill=c)
    def diamond(x,y,size,c):p([(x,y-size),(x+size,y),(x,y+size),(x-size,y)],c)
    def star(x,y,c):l([(x-3,y),(x+3,y)],c);l([(x,y-3),(x,y+3)],c);r((x,y,x+1,y+1),'#fff0cf')
    if kind in [0,6]:
        # Cast bronze bell, lunar handle and three relief bands.
        d.ellipse((25,5,39,19),outline=INK,width=4);d.ellipse((27,6,37,17),outline='#d0bd89',width=2)
        p([(23,18),(41,18),(47,40),(53,47),(52,53),(12,53),(11,47),(17,40)],INK)
        p([(24,20),(40,20),(44,39),(49,47),(15,47),(21,39)],'#a48c58')
        p([(25,22),(31,21),(28,41),(19,45),(23,34)],'#ead6a0');p([(34,21),(39,23),(43,39),(47,45),(37,43)],'#786548')
        l([(19,41),(44,41)],'#d1ba7f',2);l([(15,47),(49,47)],'#f3dfaa',2);r((14,49,50,51),'#c1a26b')
        d.ellipse((27,49,37,59),fill=INK);d.ellipse((29,50,35,56),fill='#e2ca91')
        diamond(32,32,6,'#3b4c5b');diamond(32,32,3,'#c6d5d2')
        if kind==6:
            for box in [(6,22,59,59),(2,15,63,63)]:d.arc(box,180,355,fill='#bdbfdb',width=2)
            star(11,14,'#eee5b4');star(53,14,'#d0c6eb');diamond(32,10,4,'#e7dcbb')
    elif kind in [1,7]:
        # Jointed steel fist with four separate finger plates and wrist straps.
        p([(15,7),(43,7),(50,15),(51,34),(44,43),(43,58),(17,58),(17,42),(10,32),(10,20)],INK)
        p([(18,10),(40,10),(47,16),(47,31),(41,38),(20,39),(14,30),(14,21)],'#9e8872')
        for x,y in [(18,11),(25,10),(32,11),(39,13)]:
            r((x,y,x+5,y+18),'#dac5a4');l([(x+1,y+2),(x+3,y+2)],'#fff1d0');l([(x,y+14),(x+4,y+14)],'#5c6068')
        p([(15,22),(21,25),(22,34),(18,37),(14,30)],'#bea27f');l([(16,24),(19,27)],'#eee0b8',2)
        p([(21,40),(40,40),(39,54),(22,54)],'#695755');l([(19,44),(41,44)],'#bc9e74',3);l([(19,51),(40,51)],'#bb9770',3)
        diamond(31,35,5,'#b76962' if kind==7 else '#7296a0');diamond(31,35,2,'#f3d5a4')
        if kind==7:
            for x in [9,51]:l([(x,40),(x-4,30),(x+2,20),(x-1,10)],'#dc9aab',2)
            star(51,46,'#e7b7c0');l([(26,57),(23,61),(29,59),(34,61),(38,57)],'#c87991',2)
    elif kind==2:
        # Sapphire hourglass with visible sand and a crescent crown.
        p([(15,8),(49,8),(49,14),(44,16),(43,25),(36,32),(43,39),(44,49),(49,51),(49,57),(15,57),(15,51),(20,49),(21,39),(28,32),(21,25),(20,16),(15,14)],INK)
        r((17,9,47,13),'#b5a6c4');r((17,52,47,55),'#cabcda');l([(21,16),(22,25),(31,32),(22,40),(21,49)],'#8da6c1',2);l([(43,16),(42,25),(33,32),(42,40),(43,49)],'#d7d7e5',2)
        p([(24,18),(40,18),(39,24),(32,29),(25,24)],'#d4bd91');p([(24,47),(32,39),(40,47)],'#ddc899');l([(32,30),(32,40)],'#f3e5bb');l([(24,18),(39,18)],'#fff0ca')
        d.arc((24,1,40,14),30,330,fill='#e4d2a6',width=2);star(11,35,'#a9bddb');star(51,29,'#cdc1e6')
    elif kind==3:
        # Long ritual needle with ring eye and three garnet beads.
        l([(13,54),(48,13)],INK,8);l([(15,52),(48,14)],'#c6a5b6',3);l([(17,50),(46,16)],'#f0d5d4')
        d.ellipse((42,5,55,20),fill=INK);d.ellipse((44,7,53,18),outline='#dcb0bb',width=2)
        p([(12,49),(11,59),(20,53)],'#eee1ce')
        for x,y in [(29,35),(34,29),(39,23)]:diamond(x,y,4,INK);diamond(x,y,2,'#c77894')
        l([(47,8),(54,6),(57,13),(53,22),(57,31)],'#a96988');diamond(57,34,3,'#d38a9f');star(16,20,'#dfb6be')
    elif kind==4:
        # Paired weaving pylons joined by a visible electric thread.
        for x,y in [(17,38),(47,22)]:
            p([(x-9,y+16),(x+8,y+16),(x+11,y+10),(x+6,y+5),(x+4,y-14),(x,y-23),(x-4,y-14),(x-6,y+5),(x-11,y+10)],INK)
            p([(x-6,y+12),(x+6,y+12),(x+3,y+4),(x+2,y-13),(x,y-19),(x-2,y-13),(x-3,y+4)],'#7da3b5')
            l([(x,y-14),(x,y+3)],'#e0eedb',2);r((x-5,y+6,x+5,y+9),'#b8a578');diamond(x,y-11,3,'#a7e0e4')
        l([(19,23),(28,24),(29,14),(37,17),(45,10)],'#91cadd',3);l([(19,23),(28,24),(29,14),(37,17),(45,10)],'#eff3ce')
        star(9,10,'#b5d6dd');star(53,48,'#b5d6dd')
    else:
        # Heavy star-shaped flail head, socket, linked chain and wrapped handle.
        l([(12,54),(23,42)],INK,7);l([(12,54),(23,42)],'#bd9d6e',3)
        for i in range(5):
            x=24+i*3;y=39-i*4;d.ellipse((x-3,y-4,x+3,y+3),outline='#abb3b8',width=2)
        cx,cy=40,25
        for i in range(6):
            a=i*math.pi/3;p([(cx+round(math.cos(a-.3)*13),cy+round(math.sin(a-.3)*13)),(cx+round(math.cos(a)*23),cy+round(math.sin(a)*23)),(cx+round(math.cos(a+.3)*13),cy+round(math.sin(a+.3)*13))],INK)
            l([(cx+round(math.cos(a)*12),cy+round(math.sin(a)*12)),(cx+round(math.cos(a)*20),cy+round(math.sin(a)*20))],'#d1c4a1',3)
        d.ellipse((26,11,54,39),fill=INK);d.ellipse((29,14,51,36),fill='#788794' if kind==8 else '#8e8978');d.ellipse((32,17,48,33),outline='#c7d6d8' if kind==8 else '#ddd0a7',width=2);diamond(40,25,5,'#a1d9e3' if kind==8 else '#c9b783');diamond(40,25,2,'#f5edc7')
        if kind==8:l([(9,25),(15,15),(21,20),(25,5)],'#b0e3e8',2);star(12,40,'#d6ede2')
    return im

def generate(out=ROOT/'public'/'art'):
    old=Image.open(out/'pixel-weapons.png').convert('RGBA');atlas=Image.new('RGBA',(384,448));atlas.paste(old,(0,0))
    preview=Image.new('RGB',(768,256),'#12202b')
    for i in range(9):
        im=icon(i);index=48+i-16;atlas.paste(im,((index%6)*64,(index//6)*64))
        x=i*128 if i<6 else (i-6)*128+192;y=0 if i<6 else 128;preview.paste(im.resize((128,128),Image.Resampling.NEAREST),(x,y),im.resize((128,128),Image.Resampling.NEAREST))
    atlas.save(out/'pixel-weapons.png',optimize=True);atlas.resize((768,896),Image.Resampling.NEAREST).save(out/'pixel-weapons-preview.png');preview.save(out/'pixel-ritual-preview.png')
    print('Six weapons and three artifacts:',atlas.size)
if __name__=='__main__':generate()
