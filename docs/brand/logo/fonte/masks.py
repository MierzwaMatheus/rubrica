import numpy as np
from PIL import Image
from skimage import filters, morphology
SRC='/tmp/orca-paste-1792757614373-7475442b-ab5d-45d4-a97d-884833433802.png'
BOX=(450,250,965,490); K=4
im=Image.open(SRC).convert('RGB').crop(BOX)
im=im.resize((im.width*K,im.height*K),Image.LANCZOS)
a=np.asarray(im).astype(float)/255; R,G,B=a[...,0],a[...,1],a[...,2]
lum=0.299*R+0.587*G+0.114*B; sat=a.max(-1)-a.min(-1)
ink=((lum<0.33)&(sat<0.18)).astype(float)
red=((R-G>0.22)&(R>0.45)).astype(float)
def clean(m,sig=2.5,minsize=4000):
    m=filters.gaussian(m,sigma=sig)>0.5
    m=morphology.remove_small_objects(m,minsize); m=morphology.remove_small_holes(m,2000)
    return m
ink=clean(ink); red=clean(red,2.0,3000)
np.save('ink.npy',ink); np.save('red.npy',red)
vis=np.full(ink.shape+(3,),245,np.uint8); vis[ink]=(26,26,24); vis[red]=(196,102,74)
Image.fromarray(vis).save('masks.png'); print(ink.shape)
# remove componentes cujo centro esteja na região da pena (canto superior direito)
from skimage import measure
def drop_nib(m):
    lab=measure.label(m); out=np.zeros_like(m)
    for p in measure.regionprops(lab):
        cy,cx=p.centroid
        if cx> (930-BOX[0])*K and cy < (380-BOX[1])*K: continue
        out[lab==p.label]=True
    return out
ink=drop_nib(ink); red=drop_nib(red)
np.save('ink.npy',ink); np.save('red.npy',red)
vis=np.full(ink.shape+(3,),245,np.uint8); vis[ink]=(26,26,24); vis[red]=(196,102,74)
Image.fromarray(vis).save('masks.png')
# reconstrói o fio no ponto onde a pena tocava (colunas 1812-1888): centro por ajuste quadrático, espessura linear
xs=[x for x in list(range(1770,1812,2))+list(range(1890,1930,2))]
cen=[];th=[]
for x in xs:
    ys=np.where(red[440:600,x])[0]+440; cen.append((ys.min()+ys.max())/2); th.append(ys.max()-ys.min()+1)
pc=np.polyfit(xs,cen,2); pt=np.polyfit(xs,th,1)
for x in range(1812,1890):
    red[440:600,x]=False
    c=np.polyval(pc,x); t=np.polyval(pt,x)/2
    red[int(round(c-t)):int(round(c+t))+1,x]=True
np.save('red.npy',red)
