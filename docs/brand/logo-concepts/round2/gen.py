import math
INK="#1A1A18"; TERRA="#C4664A"; CREAM="#F5F2EA"

# --- r caligráfico (itálico de alto contraste): bico de entrada, haste grossa inclinada,
#     pé em cunha que desce além da linha de base, braço em fio terminando em gota.
STEM = ("M104 90 C112 80 126 70 142 66 C150 64 154 68 152 76 "   # bico -> topo da haste
        "C146 110 136 150 128 186 "                               # borda direita
        "C125 196 114 204 96 210 "                                 # pé em cunha
        "C102 196 106 186 108 176 "
        "C114 146 120 116 124 96 "                                 # borda esquerda
        "C118 92 112 90 104 90 Z")
ARM  = ("M146 98 C154 80 168 72 184 72 C195 72 203 80 203 91 "
        "C203 102 195 109 185 109 C176 109 170 103 170 96 "
        "C169 89 161 87 155 93 C151 97 149 103 147 110 Z")

def bez(p0,p1,p2,p3,t):
    u=1-t; return tuple(u**3*a+3*u*u*t*b+3*u*t*t*c+t**3*d for a,b,c,d in zip(p0,p1,p2,p3))
# floreio: centro + perfil de pressão de pena pontuda
SEGS=[((38,188),(42,199),(56,200),(76,195)),
      ((74,195),(122,187),(182,179),(214,170)),
      ((214,170),(234,164),(242,148),(228,142))]
def width(s):  # s in 0..1
    pts=[(0,10.0),(0.08,4.0),(0.45,8.0),(0.80,3.0),(1.0,1.6)]
    for (a,wa),(b,wb) in zip(pts,pts[1:]):
        if a<=s<=b: k=(s-a)/(b-a); k=k*k*(3-2*k); return wa+(wb-wa)*k
def flourish(scale_w=1.0):
    P=[]
    for i,sg in enumerate(SEGS):
        for j in range(60 if i!=1 else 120):
            P.append(bez(*sg,j/(60 if i!=1 else 120)))
    P.append(SEGS[-1][3])
    L=[0]
    for a,b in zip(P,P[1:]): L.append(L[-1]+math.dist(a,b))
    left=[];right=[]
    for i,p in enumerate(P):
        a=P[max(i-1,0)]; b=P[min(i+1,len(P)-1)]
        dx,dy=b[0]-a[0],b[1]-a[1]; n=math.hypot(dx,dy); nx,ny=-dy/n,dx/n
        w=width(L[i]/L[-1])*scale_w/2
        left.append((p[0]+nx*w,p[1]+ny*w)); right.append((p[0]-nx*w,p[1]-ny*w))
    poly=left+right[::-1]
    d="M"+" L".join(f"{x:.1f} {y:.1f}" for x,y in poly)+" Z"
    s0=P[0]; r0=width(0)*scale_w/2; e=P[-1]; r1=width(1)*scale_w/2
    return d, (s0,r0), (e,r1)

def mark(r_fill, f_fill, scale_w=1.0):
    d,(s0,r0),(e,r1)=flourish(scale_w)
    return (f'<g fill="{f_fill}"><path d="{d}"/><circle cx="{s0[0]}" cy="{s0[1]}" r="{r0:.1f}"/><circle cx="{e[0]}" cy="{e[1]}" r="{r1:.1f}"/></g>'
            f'<g fill="{r_fill}"><path d="{STEM}"/><path d="{ARM}"/></g>')
def svg(w,h,body,title): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><title>{title}</title>{body}</svg>'
CENTER="translate(-12 -8)"   # centralização óptica do conjunto r+floreio (bbox ~38..243 x 64..210)

# C — Assinatura (fiel ao original)
c_sym = f'<g transform="{CENTER}">{mark(INK,TERRA)}</g>'
open("c-assinatura.svg","w").write(svg(256,256,c_sym,"Rubrica C - Assinatura"))
# C mono
open("c-assinatura-mono.svg","w").write(svg(256,256,f'<g transform="{CENTER}">{mark("#000","#000")}</g>',"Rubrica C mono"))
# B — Rubricado: bloco terracota, r creme, floreio creme reforçado
blk='<rect x="20" y="20" width="216" height="216" rx="52" fill="%s"/>'
b_in=f'<g transform="translate(128 132) scale(0.78) translate(-140 -137)">{mark(CREAM,CREAM,1.5)}</g>'
open("b-rubricado.svg","w").write(svg(256,256,blk%TERRA+b_in,"Rubrica B - Rubricado"))
b_ink=f'<g transform="translate(128 132) scale(0.78) translate(-140 -137)">{mark(CREAM,TERRA,1.5)}</g>'
open("b-rubricado-ink.svg","w").write(svg(256,256,blk%INK+b_ink,"Rubrica B - Rubricado (tinta)"))
# lockups (nome em Noto Serif Display Italic — <text> só para exploração)
word=f'<text x="0" y="0" font-family="Noto Serif Display" font-style="italic" font-weight="500" font-size="150" fill="{INK}" letter-spacing="-2">rubrica</text>'
for n,sym in [("c",c_sym),("b",blk%TERRA+b_in),("bink",blk%INK+b_ink)]:
    open(f"{n}-lockup.svg","w").write(svg(830,256,f'<g>{sym}</g><g transform="translate(290 178)">{word}</g>',f"Rubrica {n} lockup"))
