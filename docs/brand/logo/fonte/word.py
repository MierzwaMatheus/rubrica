"""Converte texto em contornos SVG (fontTools + HarfBuzz para kerning)."""
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import io

def outline(font_path, text, size, wght=None, tracking=0):
    tt = TTFont(font_path)
    if wght is not None and 'fvar' in tt:
        tt = instantiateVariableFont(tt, {'wght': wght})
    buf = io.BytesIO(); tt.save(buf); data = buf.getvalue()
    tt = TTFont(io.BytesIO(data))
    face = hb.Face(data); font = hb.Font(face)
    upem = face.upem; s = size / upem
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(font, b, {"kern": True, "liga": True})
    gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    pen = SVGPathPen(gs); x = 0
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        name = order[info.codepoint]
        tp = TransformPen(pen, (s, 0, 0, -s, (x + pos.x_offset) * s, -pos.y_offset * s))
        gs[name].draw(tp)
        x += pos.x_advance + tracking * upem
    os2 = tt['OS/2']
    return pen.getCommands(), x * s, os2.sxHeight * s
