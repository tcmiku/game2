"""Moonlit northern shrine court and five original carved-stone effigies."""
from pathlib import Path
from PIL import Image,ImageDraw
import random,math
ROOT=Path(__file__).resolve().parents[1]
def sakura(d,rng,x,y,size=1):
    """Gnarled branches and broad, stepped blossom clusters, rooted at (x,y)."""
    def pts(points):return [(round(x+a*size),round(y+b*size)) for a,b in points]
    def p(points,color):d.polygon(pts(points),fill=color)
    def line(points,color,width):d.line(pts(points),fill=color,width=max(1,round(width*size)))
    d.ellipse((x-35*size,y-7*size,x+39*size,y+8*size),fill='#101c28')
    p([(-9,1),(-4,-23),(-10,-45),(-5,-58),(2,-37),(6,-60),(11,-64),(8,-30),(6,-12),(13,2)],'#202631')
    line([(-3,0),(0,-24),(-5,-45)],'#6e535a',4);line([(4,-17),(6,-38),(9,-57)],'#8e6d6c',2)
    for side in (-1,1):
        line([(0,-29),(side*18,-47),(side*39,-59)],'#252834',5)
        line([(side*13,-43),(side*19,-65),(side*32,-73)],'#6e535c',2)
    # Multiple overlapping lobes keep the canopy organic without smooth circles.
    for cx,cy,rx,ry in [(-29,-58,28,16),(24,-66,34,20),(-8,-77,32,22),(0,-55,37,17)]:
        p([(cx-rx,cy+4),(cx-rx,cy-7),(cx-rx+10,cy-7),(cx-rx+10,cy-ry+4),(cx-6,cy-ry+4),(cx-6,cy-ry),(cx+rx-11,cy-ry),(cx+rx-11,cy-ry+7),(cx+rx,cy-ry+7),(cx+rx,cy+4),(cx+rx-8,cy+4),(cx+rx-8,cy+ry),(cx-10,cy+ry),(cx-10,cy+ry-5),(cx-rx+5,cy+ry-5),(cx-rx+5,cy+4)],'#493d50')
        for _ in range(58):
            a=rng.random()*math.tau;r=math.sqrt(rng.random());xx=cx+math.cos(a)*rx*.88*r;yy=cy+math.sin(a)*ry*.82*r-4
            tone=rng.choice(['#76586d','#956c7e','#b08293','#c79ba7'] if yy<cy else ['#665068','#805e75','#a37589'])
            w=rng.randrange(3,8);h=rng.randrange(2,5)
            p([(xx,yy),(xx+w-2,yy),(xx+w-2,yy+1),(xx+w,yy+1),(xx+w,yy+h),(xx+1,yy+h),(xx+1,yy+h+1),(xx,yy+h+1)],tone)
        for _ in range(14):
            xx=cx+rng.randrange(-rx+9,rx-8);yy=cy+rng.randrange(-ry+3,2)
            line([(xx,yy),(xx+2,yy)],rng.choice(['#dfb7bf','#e9cbc9','#cfa4b1']),1)
    line([(-2,-28),(-15,-40),(-24,-43)],'#9c7780',1)

def altar_stone():
    rng=random.Random(84);im=Image.new('RGB',(96,96),'#303943');d=ImageDraw.Draw(im)
    for _ in range(250):
        x,y=rng.randrange(96),rng.randrange(96);d.line([(x,y),(x+rng.randrange(1,4),y)],fill=rng.choice(['#333d46','#2c353f','#37414a']))
    for points in [[(8,0),(11,7),(8,13),(15,18)],[(96,63),(86,65),(82,73),(76,75)],[(29,96),(32,88),(29,83)]]:
        d.line(points,fill='#222c37');d.line([(x+1,y) for x,y in points],fill='#414a51')
    return im

def court():
    rng=random.Random(713);im=Image.new('RGB',(640,420),'#101d28');d=ImageDraw.Draw(im)
    for _ in range(4500):
        x,y=rng.randrange(640),rng.randrange(420);d.rectangle((x,y,x+rng.randrange(2,8),y+rng.randrange(1,3)),fill=rng.choice(['#172b34','#1b3037','#20383c','#152731']))
    d.ellipse((65,44,577,393),fill='#0a151f');d.ellipse((72,36,570,382),fill='#5b6b6b');d.ellipse((77,39,565,376),fill='#253740')
    paving=Image.new('RGB',im.size,'#24363e');pd=ImageDraw.Draw(paving);mask=Image.new('L',im.size);md=ImageDraw.Draw(mask);md.ellipse((80,42,562,370),fill=255);md.rectangle((279,318,361,420),fill=255)
    for row,y in enumerate(range(28,421,17)):
        for x in range(60-(row%2)*15,586,31):
            tone=rng.choice(['#394b50','#3c4e51','#35494e','#405054','#3a4a50']);pd.polygon([(x+2,y+2),(x+28,y+1),(x+29,y+14),(x+1,y+15)],fill=tone);pd.line([(x+3,y+2),(x+27,y+2)],fill='#58686a');pd.line([(x+29,y+3),(x+29,y+14),(x+3,y+15)],fill='#233740')
            if rng.random()<.45:
                px=x+rng.randrange(7,20);pd.line([(px,y+3),(px-2,y+6),(px+2,y+8),(px+1,y+13)],fill='#2a3e46')
            for _ in range(3):
                px,py=x+rng.randrange(4,25),y+rng.randrange(4,12);pd.line([(px,py),(px+2,py)],fill=rng.choice(['#44595a','#30454b','#4b5c5c']))
    im.paste(paving,(0,0),mask);d=ImageDraw.Draw(im)
    for x,y,r in [(320,200,58),(165,198,37),(475,198,37),(178,323,37),(463,323,37)]:
        for radius,color in [(r+5,'#142832'),(r+2,'#65736e'),(r,'#33484d'),(r-5,'#9a9880'),(r-7,'#344a50')]:d.ellipse((x-radius,y-radius//3,x+radius,y+radius//3),fill=color)
        for i in range(12):
            a=i*math.tau/12;xx=x+round(math.cos(a)*(r-3));yy=y+round(math.sin(a)*(r-3)/3);d.line([(xx,yy-1),(xx+1,yy+1)],fill='#b5b495')
    for y in range(370,420,9):d.line([(281,y),(359,y)],fill='#73827c',width=2);d.line([(282,y+3),(358,y+3)],fill='#20363e')
    # Ancient columns, fallen blocks, moss and deliberate forest silhouettes.
    for x,y in [(91,128),(549,128),(100,306),(540,306)]:
        d.rectangle((x-6,y-38,x+6,y+12),fill='#1c303c');d.rectangle((x-4,y-35,x+3,y+8),fill='#566969');d.rectangle((x-9,y-41,x+9,y-35),fill='#7b877c');d.rectangle((x-9,y+8,x+9,y+13),fill='#6c7970');d.line([(x+4,y-34),(x+4,y+8)],fill='#2e444c')
    for _ in range(420):
        a=rng.random()*math.tau;x=320+int(math.cos(a)*rng.uniform(236,260));y=207+int(math.sin(a)*rng.uniform(158,174))
        d.rectangle((x,y,x+3,y+1),fill=rng.choice(['#536754','#415b4d','#6b785c','#344b44']))
    for x,y,size in [(53,116,1.02),(143,54,.92),(260,30,.86),(429,34,.9),(545,70,1.04),(611,169,.98),(31,277,1.05),(609,330,1.12),(103,408,1.08),(538,428,1.08)]:
        sakura(d,rng,x,y,size)
    # A few settled petals collect at the moss line and along the entrance steps.
    for _ in range(190):
        a=rng.random()*math.tau;x=320+round(math.cos(a)*rng.uniform(218,258));y=207+round(math.sin(a)*rng.uniform(145,173))
        d.line([(x,y),(x+1,y)],fill=rng.choice(['#b3879b','#936b83','#d2a7b4','#70576f']))
    for _ in range(35):
        x,y=rng.randrange(282,358),rng.randrange(344,420);d.line([(x,y),(x+1,y)],fill=rng.choice(['#b98c9b','#8b657d']))
    return im.resize((1280,840),Image.Resampling.NEAREST)
def statue(kind):
    im=Image.new('RGBA',(64,96));d=ImageDraw.Draw(im);ink='#172c38';stone='#869895';light='#b2bbb0';shade='#536d73'
    def p(points,c):d.polygon(points,fill=c)
    def r(b,c):d.rectangle(b,fill=c)
    p([(8,84),(16,78),(49,78),(57,84),(57,92),(7,92)],ink);r((11,84,53,89),stone);r((15,80,49,84),light);r((11,90,53,92),shade)
    # Layered robe, shoulders and a hood carved into one solid stone body.
    p([(19,34),(27,28),(40,28),(47,35),(46,51),(51,76),(47,80),(17,80),(13,76),(18,54)],ink)
    p([(22,35),(29,32),(37,32),(43,37),(41,53),(47,76),(19,76),(24,53)],stone)
    p([(24,43),(30,36),(28,60),(24,75),(20,75)],light);p([(36,39),(42,38),(39,56),(46,75),(36,75)],shade)
    d.line([(32,45),(30,74)],fill='#ced0b7',width=1);d.line([(37,57),(40,74)],fill='#334f5b',width=2)
    p([(23,17),(27,10),(37,10),(42,18),(40,30),(34,35),(27,31)],ink);p([(27,17),(30,13),(36,14),(39,19),(37,28),(32,31),(28,27)],light);p([(29,19),(36,18),(36,27),(32,30),(29,26)],shade);r((29,21,31,22),'#ced0b7');r((34,21,36,22),'#ced0b7')
    if kind==0:
        # Radiant crown, stone braziers and cupped hands around the first flame.
        p([(24,11),(22,3),(29,7),(32,1),(36,7),(43,3),(40,12)],ink);p([(26,9),(25,6),(30,9),(32,4),(35,9),(40,6),(38,10)],'#b8ac82')
        p([(19,40),(24,39),(29,49),(27,53),(21,48)],light);p([(45,40),(40,39),(35,49),(37,53),(43,48)],stone)
        p([(22,49),(42,49),(39,56),(25,56)],ink);r((25,50,39,52),'#b5a785');p([(28,47),(27,40),(31,42),(33,33),(35,42),(39,40),(37,48)],'#c9b475');p([(31,47),(33,39),(35,47)],'#eee0a1')
        d.line([(17,64),(20,65),(18,70)],fill='#c1b994');d.line([(46,61),(43,64),(46,67)],fill='#a9b5ac')
    elif kind==1:
        p([(41,22),(45,16),(49,22),(46,59),(42,59)],ink);p([(44,24),(45,20),(47,24),(45,55),(43,55)],light);r((37,55,51,58),'#b5a188');r((43,59,46,68),shade);r((39,43,44,47),light)
    elif kind==2:
        p([(15,43),(27,39),(36,44),(35,61),(26,70),(16,60)],ink);p([(18,45),(26,42),(33,46),(32,59),(26,66),(19,58)],shade);d.line([(26,47),(26,61)],fill=light,width=2);p([(26,53),(21,47),(20,53),(25,57)],'#a4b997');p([(27,56),(32,49),(33,55),(27,61)],'#c0c6aa')
    elif kind==3:
        for side in [-1,1]:
            x=32+side*18;p([(x,36),(x+side*12,22),(x+side*10,45),(x,55)],ink)
            for j in range(4):d.line([(x,39+j*3),(x+side*(10-j*2),29+j*4)],fill=light,width=2)
        p([(27,15),(23,8),(31,11)],'#9fb6bb')
    else:
        r((44,24,47,72),ink);r((45,26,46,70),light);p([(46,12),(53,23),(46,33),(39,23)],ink);p([(46,16),(50,23),(46,29),(42,23)],'#b2a5c0');p([(46,20),(48,23),(46,26),(44,23)],'#e5decb');r((39,45,46,49),stone)
    # Erosion, robe cuts and a carved emblem on the pedestal.
    d.line([(20,71),(23,68),(22,62)],fill='#3c5963');d.line([(47,83),(42,84),(44,88)],fill='#4a646a');p([(32,82),(36,86),(32,89),(28,86)],shade);r((31,85,33,87),'#c4c3a6')
    return im.resize((128,192),Image.Resampling.NEAREST)
def generate():
    out=ROOT/'public/art';court().save(out/'pixel-sanctuary.png',optimize=True);atlas=Image.new('RGBA',(640,192))
    for i in range(5):atlas.paste(statue(i),(i*128,0))
    atlas.save(out/'pixel-sanctuary-statues.png',optimize=True)
    altar_stone().save(out/'pixel-shrine-stone.png',optimize=True)
if __name__=='__main__':generate()
