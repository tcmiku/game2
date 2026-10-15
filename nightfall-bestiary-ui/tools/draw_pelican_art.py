"""Original pelican carrying a chainsaw, matching the shared 64px pixel atlas."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
def generate():
    im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
    ink='#142032';white='#edf2e5';shade='#a9becb';gold='#e5b35d'
    def p(points,c):d.polygon(points,fill=c)
    def r(box,c):d.rectangle(box,fill=c)
    # Broad white body, folded feathers, long neck and distinctive throat pouch.
    p([(5,31),(12,25),(20,24),(22,12),(27,7),(34,7),(38,11),(37,19),(32,24),(33,36),(28,46),(17,47),(9,41)],ink)
    p([(8,32),(15,27),(24,27),(25,13),(29,10),(34,10),(35,14),(32,20),(28,23),(30,36),(26,43),(18,44),(12,40)],white)
    p([(9,34),(17,30),(24,33),(26,40),(20,43),(13,40)],shade)
    p([(32,17),(57,20),(52,24),(36,23),(33,29),(29,24)],ink)
    p([(33,18),(54,21),(35,21)],gold)
    p([(33,22),(47,23),(38,29),(33,28),(31,24)],'#d09053')
    r((32,13,34,15),ink);r((33,13,33,13),'#fff8d6')
    # Orange webbed feet and a violet scarf.
    p([(18,44),(22,44),(22,50),(27,52),(16,53),(17,50)],ink)
    p([(19,46),(20,46),(20,51),(24,51),(18,51)],gold)
    p([(24,44),(27,43),(28,49),(33,51),(25,52)],ink)
    p([(25,46),(26,46),(27,50),(30,50),(26,51)],gold)
    r((24,25,30,28),'#927fb6');p([(24,27),(17,26),(11,29),(18,31)],'#b7a2d7')
    # Handle, engine, oil cap and toothed long steel chain bar.
    r((29,30,40,37),ink);r((32,32,37,35),'#8ca0ab')
    p([(37,34),(58,34),(63,38),(63,43),(58,46),(37,46)],ink)
    p([(40,36),(58,36),(61,39),(61,42),(57,44),(40,44)],'#c3d1cd')
    r((42,39,58,41),'#647987');r((44,37,57,37),'#f4eed6')
    for x in range(42,60,5):r((x,34,x+2,35),'#f0e6ba');r((x,45,x+2,46),'#f0e6ba')
    r((26,35,41,47),ink);r((28,37,39,45),'#8f78ae');r((29,37,38,39),'#c0a4d5')
    r((31,41,35,43),'#382f52');r((37,35,39,36),gold)
    # The near wing visibly grips the rear handle.
    p([(22,31),(27,32),(32,38),(30,41),(25,38),(21,35)],ink)
    p([(23,32),(26,33),(30,38),(28,38),(23,35)],white)
    atlas=Image.open(ROOT/'public/art/pixel-weapons.png').convert('RGBA')
    index=57-16;atlas.paste(im,(index%6*64,index//6*64));atlas.save(ROOT/'public/art/pixel-weapons.png',optimize=True)
    atlas.resize((768,atlas.height*2),Image.Resampling.NEAREST).save(ROOT/'public/art/pixel-weapons-preview.png')
if __name__=='__main__':generate()
