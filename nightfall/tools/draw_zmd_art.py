"""Original pixel power pylon and orbital carrier icons; extends the shared atlas."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
def icon(ship=False):
    im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im);ink='#142130';steel='#a9babc';white='#e0e7d8';gold='#e7c85e'
    def p(v,c):d.polygon(v,fill=c)
    def r(v,c):d.rectangle(v,fill=c)
    if not ship:
        p([(12,53),(21,45),(43,45),(53,53),(51,59),(13,59)],ink);r((16,52,48,56),steel)
        r((24,18,40,50),ink);r((27,20,37,50),white);r((35,22,37,49),'#637d89')
        r((21,33,43,42),ink);r((23,35,41,40),gold)
        for x in range(25,42,5):r((x,35,x+2,39),'#303640')
        p([(8,15),(15,10),(49,10),(56,15),(53,23),(11,23)],ink);r((12,15,52,20),white);r((12,19,52,21),steel)
        for x in [17,39]:
            r((x,3,x+8,16),ink);r((x+2,5,x+6,14),gold);r((x+1,7,x+7,8),'#fff2ab');r((x+1,11,x+7,12),'#fff2ab')
        r((30,25,33,31),gold)
        d.line([(7,29),(11,34),(8,39),(12,45)],fill='#e8dc7a',width=2);d.line([(56,27),(52,32),(56,37),(52,42)],fill='#e8dc7a',width=2)
    else:
        p([(2,22),(15,14),(47,12),(62,21),(54,31),(18,34),(5,29)],ink)
        p([(8,22),(19,17),(46,15),(56,21),(49,27),(18,29)],steel)
        p([(21,13),(36,8),(46,12),(46,21),(23,23)],ink);p([(24,14),(36,11),(43,14),(43,19),(24,21)],white)
        r((6,24,22,28),'#526d7e');r((45,21,57,25),'#526d7e')
        r((19,20,22,22),gold);r((45,17,48,19),gold)
        r((29,28,34,43),ink);r((38,27,43,42),ink);r((31,29,32,41),gold);r((40,28,41,40),gold)
        p([(31,43),(40,42),(43,58),(29,58)],'#e8cb6c');p([(34,43),(38,43),(39,59),(33,59)],'#f8ffe1')
        d.ellipse((21,51,51,61),outline=gold,width=2);d.line([(15,56),(57,56)],fill='#91ccd7',width=1)
    return im
def generate():
    out=ROOT/'public/art';old=Image.open(out/'pixel-weapons.png').convert('RGBA');atlas=Image.new('RGBA',(384,512));atlas.paste(old,(0,0))
    preview=Image.new('RGB',(512,256),'#14212c')
    for n in range(2):
        im=icon(bool(n));idx=58+n-16;atlas.paste(im,(idx%6*64,idx//6*64));large=im.resize((256,256),Image.Resampling.NEAREST);preview.paste(large,(n*256,0),large)
    atlas.save(out/'pixel-weapons.png',optimize=True);atlas.resize((768,1024),Image.Resampling.NEAREST).save(out/'pixel-weapons-preview.png');preview.save(out/'pixel-zmd-preview.png')
if __name__=='__main__':generate()
