"""Vetoriza máscaras em Béziers cúbicas limpas (ajuste de Schneider), preservando cantos vivos."""
import numpy as np
from skimage import measure, filters, morphology

def contours(mask, sigma):
    f = np.pad(filters.gaussian(mask.astype(float), sigma=sigma), 2)
    out = []
    for c in measure.find_contours(f, 0.5):
        if len(c) < 60:
            continue
        pts = np.array([(x - 2, y - 2) for y, x in c])
        if np.allclose(pts[0], pts[-1]):
            pts = pts[:-1]
        out.append(pts)
    return out

def resample(pts, step):
    closed = np.vstack([pts, pts[:1]])
    seg = np.linalg.norm(np.diff(closed, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    n = max(8, int(s[-1] / step))
    t = np.linspace(0, s[-1], n, endpoint=False)
    return np.column_stack([np.interp(t, s, closed[:, 0]), np.interp(t, s, closed[:, 1])])

def corners(pts, k, ang_deg):
    n = len(pts)
    ang = np.zeros(n)
    for i in range(n):
        a = pts[i] - pts[(i - k) % n]
        b = pts[(i + k) % n] - pts[i]
        cosv = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9)
        ang[i] = np.degrees(np.arccos(np.clip(cosv, -1, 1)))
    idx = [i for i in range(n) if ang[i] > ang_deg and ang[i] == max(ang[(i + j) % n] for j in range(-k, k + 1))]
    return idx

# ---- Schneider ----
def bez(ctrl, t):
    t = np.asarray(t)[:, None]; u = 1 - t
    return u**3 * ctrl[0] + 3 * u**2 * t * ctrl[1] + 3 * u * t**2 * ctrl[2] + t**3 * ctrl[3]
def bez_d1(c, t):
    t = np.asarray(t)[:, None]; u = 1 - t
    return 3 * u**2 * (c[1] - c[0]) + 6 * u * t * (c[2] - c[1]) + 3 * t**2 * (c[3] - c[2])
def bez_d2(c, t):
    t = np.asarray(t)[:, None]
    return 6 * (1 - t) * (c[2] - 2 * c[1] + c[0]) + 6 * t * (c[3] - 2 * c[2] + c[1])

def chord_param(p):
    d = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))])
    return d / d[-1]

def gen_bezier(p, u, t1, t2):
    p0, p3 = p[0], p[-1]
    A1 = t1[None, :] * (3 * (1 - u)**2 * u)[:, None]
    A2 = t2[None, :] * (3 * (1 - u) * u**2)[:, None]
    C = np.array([[np.sum(A1 * A1), np.sum(A1 * A2)], [np.sum(A1 * A2), np.sum(A2 * A2)]])
    tmp = p - bez(np.array([p0, p0, p3, p3]), u)
    X = np.array([np.sum(A1 * tmp), np.sum(A2 * tmp)])
    det = np.linalg.det(C)
    seg = np.linalg.norm(p3 - p0)
    if abs(det) > 1e-12:
        a1 = (X[0] * C[1, 1] - X[1] * C[0, 1]) / det
        a2 = (C[0, 0] * X[1] - C[1, 0] * X[0]) / det
    else:
        a1 = a2 = seg / 3
    eps = 1e-6 * seg
    if a1 < eps or a2 < eps:
        a1 = a2 = seg / 3
    return np.array([p0, p0 + t1 * a1, p3 + t2 * a2, p3])

def reparam(c, p, u):
    d = bez(c, u) - p
    d1 = bez_d1(c, u); d2 = bez_d2(c, u)
    num = np.sum(d * d1, axis=1)
    den = np.sum(d1 * d1, axis=1) + np.sum(d * d2, axis=1)
    with np.errstate(divide='ignore', invalid='ignore'):
        nu = np.where(np.abs(den) > 1e-12, u - num / den, u)
    return np.clip(nu, 0, 1)

def fit_cubic(p, t1, t2, err, out):
    if len(p) == 2:
        d = np.linalg.norm(p[1] - p[0]) / 3
        out.append(np.array([p[0], p[0] + t1 * d, p[1] + t2 * d, p[1]])); return
    u = chord_param(p)
    c = gen_bezier(p, u, t1, t2)
    for _ in range(6):
        dist = np.linalg.norm(bez(c, u) - p, axis=1)
        if dist.max() < err:
            out.append(c); return
        u = reparam(c, p, u)
        c = gen_bezier(p, u, t1, t2)
    dist = np.linalg.norm(bez(c, u) - p, axis=1)
    if dist.max() < err:
        out.append(c); return
    split = int(np.clip(np.argmax(dist), 1, len(p) - 2))
    tc = p[split - 1] - p[split + 1]; tc /= np.linalg.norm(tc) + 1e-12
    fit_cubic(p[:split + 1], t1, tc, err, out)
    fit_cubic(p[split:], -tc, t2, err, out)

def unit(v):
    return v / (np.linalg.norm(v) + 1e-12)

def fit_closed(pts, err, step, k, ang, smooth_sigma=0):
    pts = resample(pts, step)
    n = len(pts)
    cs = corners(pts, k, ang)
    smooth_split = not cs
    if smooth_split:
        cs = [0, n // 2]
    segs = []
    for a, b in zip(cs, cs[1:] + [cs[0] + n]):
        idx = [i % n for i in range(a, b + 1)]
        p = pts[idx]
        if smooth_sigma and len(p) > 8:
            from scipy.ndimage import gaussian_filter1d
            sp = gaussian_filter1d(p, smooth_sigma, axis=0, mode='nearest')
            w = np.minimum(1, np.minimum(np.arange(len(p)), np.arange(len(p))[::-1]) / (2 * smooth_sigma))[:, None]
            p = sp * w + p * (1 - w)
        if smooth_split:   # tangentes centrais nos pontos de divisão (sem canto)
            t1 = unit(pts[(a + 1) % n] - pts[(a - 1) % n]); t2 = -unit(pts[(b + 1) % n] - pts[(b - 1) % n])
        else:              # tangentes laterais (canto vivo)
            t1 = unit(p[min(3, len(p) - 1)] - p[0]); t2 = unit(p[max(-4, -len(p))] - p[-1])
        fit_cubic(p, t1, t2, err, segs)
    return segs

def to_d(segs_list, s=1.0, ox=0.0, oy=0.0, nd=1):
    f = lambda v: f"{v:.{nd}f}".rstrip('0').rstrip('.')
    P = lambda q: f"{f((q[0] - ox) * s)} {f((q[1] - oy) * s)}"
    out = []
    for segs in segs_list:
        d = "M" + P(segs[0][0])
        for c in segs:
            d += " C" + P(c[1]) + " " + P(c[2]) + " " + P(c[3])
        out.append(d + "Z")
    return " ".join(out)

def vectorize(mask, sigma, err=1.6, step=2.0, k=5, ang=55, smooth_sigma=0):
    return [fit_closed(c, err, step, k, ang, smooth_sigma) for c in contours(mask, sigma)]
