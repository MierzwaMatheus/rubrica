"""Gera o kit de logo da Rubrica (SVGs-mestre) em docs/brand/logo/svg."""
import sys, os, json
sys.path.insert(0, '.')
from geom import full, small, r_only, DIM
from word import outline

OUT = os.path.expanduser('~/PARA/01-Projetos/Programacao/Pessoais/rubrica/docs/brand/logo/svg')
os.makedirs(OUT, exist_ok=True)

C = dict(ink='#1A1A18', terra='#C4664A', cream='#F5F2EA', black='#000000', white='#FFFFFF')
# esquema -> (cor do r, cor do floreio, cor do nome)
SCHEMES = {
    'positivo': (C['ink'], C['terra'], C['ink']),
    'negativo': (C['cream'], C['terra'], C['cream']),
    'preto': (C['black'],) * 3,
    'branco': (C['white'],) * 3,
    'terracota': (C['terra'],) * 3,
    'creme': (C['cream'],) * 3,
}

W, H = DIM
R, F = full()
Rs, Fs = small()
Ro, rox, roy, row, roh = r_only()
FONT = 'fonts/CormorantGaramond-Italic[wght].ttf'

def svg(w, h, body, title, x=0, y=0):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:g} {y:g} {w:g} {h:g}" '
            f'width="{w:g}" height="{h:g}" role="img"><title>{title}</title>{body}</svg>\n')

def mark(r, f, cr, cf):
    return f'<path fill="{cr}" d="{r}"/><path fill="{cf}" d="{f}"/>'

# --- nome ---
WORD_SIZE = 300
wd, wadv, wxh = outline(FONT, 'rubrica', WORD_SIZE, 600, 0.012)
# limites reais do nome (para composição): ascendente do b ~ 0.72*size acima da linha de base
W_ASC, W_DESC = 0.70 * WORD_SIZE, 0.02 * WORD_SIZE

def word(color, tx, ty, s=1.0):
    return f'<g transform="translate({tx:g} {ty:g}) scale({s:g})"><path fill="{color}" d="{wd}"/></g>'

files = {}
for name, (cr, cf, cw) in SCHEMES.items():
    # símbolo completo e reduzido
    files[f'rubrica-simbolo-{name}.svg'] = svg(W, H, mark(R, F, cr, cf), 'Rubrica — símbolo')
    files[f'rubrica-simbolo-reduzido-{name}.svg'] = svg(W, H, mark(Rs, Fs, cr, cf), 'Rubrica — símbolo reduzido')
    # só o r (monograma)
    files[f'rubrica-monograma-{name}.svg'] = svg(row, roh, f'<path fill="{cr}" d="{Ro}"/>', 'Rubrica — monograma', rox, roy)
    # horizontal: símbolo + nome; linha de base do nome alinhada ao corte da haste (≈ 0.66 H)
    gap = 0.045 * W
    base = 0.64 * H
    s = 0.86
    hw = W + gap + wadv * s
    files[f'rubrica-horizontal-{name}.svg'] = svg(
        hw, H, mark(R, F, cr, cf) + word(cw, W + gap, base, s), 'Rubrica — logo horizontal')
    # vertical: símbolo centralizado sobre o nome
    vs = 0.72 * W / wadv
    vh = H + 0.10 * H + W_ASC * vs + W_DESC * vs
    files[f'rubrica-vertical-{name}.svg'] = svg(
        W, vh, mark(R, F, cr, cf) + word(cw, (W - wadv * vs) / 2, H + 0.10 * H + W_ASC * vs, vs), 'Rubrica — logo vertical')
    # só o nome
    files[f'rubrica-nome-{name}.svg'] = svg(wadv, W_ASC + W_DESC + 0.05 * WORD_SIZE, word(cw, 0, W_ASC + 0.025 * WORD_SIZE), 'Rubrica — nome')

# --- ícones (quadrado 1024, cantos de app) ---
def block(bg, inner):
    return f'<rect width="1024" height="1024" rx="232" fill="{bg}"/>{inner}'

def place(w, h, frac, oy=-0.012):
    sc = frac * 1024 / max(w, h)
    return sc, (1024 - w * sc) / 2, (1024 - h * sc) / 2 + oy * 1024

sc, tx, ty = place(W, H, 0.80)
for nm, bg, cr, cf in [('terracota', C['terra'], C['cream'], C['cream']),
                       ('tinta', C['ink'], C['cream'], C['terra']),
                       ('creme', C['cream'], C['ink'], C['terra'])]:
    inner = f'<g transform="translate({tx:.1f} {ty:.1f}) scale({sc:.4f})">{mark(Rs, Fs, cr, cf)}</g>'
    files[f'rubrica-icone-{nm}.svg'] = svg(1024, 1024, block(bg, inner), 'Rubrica — ícone')

# favicon: só o r, grande, no bloco terracota
sc, tx, ty = place(row, roh, 0.74, oy=0)
for nm, bg, cr in [('terracota', C['terra'], C['cream']), ('tinta', C['ink'], C['cream'])]:
    inner = f'<g transform="translate({tx - rox * sc:.1f} {ty - roy * sc:.1f}) scale({sc:.4f})"><path fill="{cr}" d="{Ro}"/></g>'
    files[f'rubrica-favicon-{nm}.svg'] = svg(1024, 1024, block(bg, inner), 'Rubrica — favicon')

for fn, s_ in files.items():
    open(os.path.join(OUT, fn), 'w').write(s_)
json.dump({'symbol': DIM, 'word_adv': wadv}, open(os.path.join(OUT, '..', 'dims.json'), 'w'))
print(len(files), 'arquivos em', OUT)
