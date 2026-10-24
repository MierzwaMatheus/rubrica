"""Geometria-mestra normalizada da marca Rubrica (largura do símbolo = 1000 unidades)."""
import sys, numpy as np
sys.path.insert(0, '.')
from fit import vectorize, to_d
from skimage import measure, morphology

ink = np.load('trace/ink.npy'); red = np.load('trace/red.npy')
ys, xs = np.where(ink | red)
X0, Y0, W, H = xs.min(), ys.min(), xs.max() - xs.min(), ys.max() - ys.min()
S = 1000 / W
DIM = (1000, round(H * S, 1))

def thicken_thin(m, t, d):
    """Engrossa só as partes finas (mais finas que 2t) dilatando-as em d px."""
    thin = m & ~morphology.binary_opening(m, morphology.disk(t))
    return m | (morphology.binary_dilation(thin, morphology.disk(d)) & morphology.binary_dilation(m, morphology.disk(d)))

def main_r(m):
    lab = measure.label(m); props = sorted(measure.regionprops(lab), key=lambda p: -p.area)
    return lab == props[0].label

def d_of(mask, sigma, err, ang, sm):
    return to_d(vectorize(mask, sigma, err=err, ang=ang, smooth_sigma=sm), S, X0, Y0)

def full():
    return d_of(ink, 5.0, 1.4, 55, 4), d_of(red, 3.2, 1.0, 70, 10)

def small():
    """Reduzida: fios do floreio e do braço engrossados para uso pequeno."""
    grow = lambda m, r: morphology.remove_small_holes(morphology.binary_dilation(m, morphology.disk(r)), 5000)
    return d_of(grow(ink, 3), 5.0, 1.4, 55, 4), d_of(grow(red, 6), 3.2, 1.0, 70, 10)

def r_only():
    """Só o r (sem a cunha do pé), com o fio do braço engrossado — base do favicon."""
    m = thicken_thin(main_r(ink), 7, 7)
    ys, xs = np.where(m)
    return to_d(vectorize(m, 5.0, err=1.4, ang=55, smooth_sigma=4), S, X0, Y0), (xs.min()-X0)*S, (ys.min()-Y0)*S, (xs.max()-xs.min())*S, (ys.max()-ys.min())*S
