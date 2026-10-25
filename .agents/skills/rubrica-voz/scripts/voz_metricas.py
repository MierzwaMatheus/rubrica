#!/usr/bin/env python3
"""Métricas de voz (pt-BR) sobre o Markdown da entrevista de voz do Rubrica (página /voz).

Uso:  python3 -I voz_metricas.py entrevista.md [--json saida.json]

Formato esperado (gerado pela página):
    ### A1. Pergunta
    <!-- uso: voz, apresentacao · tipo: aberta · modo: ditado -->
    resposta...

A versão em inglês (/en/voice) gera o mesmo formato, com `<!-- idioma: en -->` na 2ª
linha e o vazio `_(no answer)_`. As listas de palavras daqui são de pt-BR: em inglês, as
métricas de forma (frase, pontuação, emoji) valem; as de vocabulário, não (ver os avisos).

Separa o texto **escrito** (modo digitado ou colado) do **ditado**: ritmo e pontuação só
valem no escrito, porque o ditado do navegador vem sem pontuação confiável. Respostas
"misto" entram só no total. Réguas (tipo: regua) saem à parte.

Os números são INDÍCIOS para o agente conferir lendo o texto: com menos de ~2.000
palavras, estilometria não atribui autoria (ver references/pesquisa.md, seção 2).
Só biblioteca padrão.
"""
import json
import re
import statistics
import sys
from collections import Counter

PALAVRA = re.compile(r"[^\W\d_]+(?:[-'’][^\W\d_]+)*")
DIVIDE_FRASE = re.compile(r"(?<=[.!?…])\s+|\n{2,}")
EMOJI = re.compile("[\U0001f300-\U0001faff\U00002600-\U000027bf]")
TITULO = re.compile(r"^###\s+([A-Z]\d+)\.\s+(.*)")
BLOCO = re.compile(r"^##\s")  # título de bloco: fecha a resposta anterior
# Respostas que listam o que a pessoa NÃO usa: ficam fora da linha de base de marcas de IA.
IDS_VETOS = {"E3"}
# "muita gente" não é o pronome "a gente".
A_GENTE = re.compile(r"(?<![\w])(\w+\s+)?a gente(?![\w])", re.I)
NAO_PRONOME = {"muita", "pouca", "toda", "tanta", "essa", "esta", "aquela", "outra", "mais"}
META = re.compile(r"<!--\s*(.*?)\s*-->")
IDIOMA = re.compile(r"^<!--\s*idioma:\s*([\w-]+)\s*-->\s*$", re.M)
# Resposta em branco: "_(sem resposta)_" na página em português, "_(no answer)_" na em inglês.
VAZIO = {"_(sem resposta)_", "_(no answer)_"}

VAZIAS = set("""a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela
pelos pelas para pra pro com sem sob sobre e ou mas que se não sim é foi era ser ter tem
tinha há eu me mim meu minha meus minhas você vocês ele ela eles elas nós nosso nossa
lhe isso isto aquilo esse essa este esta aquele aquela como quando onde porque mais
menos muito já também só ao à às aos então aí lá cá até depois antes ainda bem vai
vou estou está estava são foram fui""".split())
ORAIS = ["né", "tipo", "aí", "então", "assim", "sabe", "enfim", "cara", "mano", "tá",
         "beleza", "olha", "bom", "hum", "ahn", "éh", "nossa", "pois é", "tipo assim",
         "aí então", "sabe como", "e tal", "ou seja"]
HESITACOES = ["acho", "acredito", "talvez", "provavelmente", "meio", "um pouco",
              "de certa forma", "eu diria", "parece", "às vezes"]
INTENSIFICADORES = ["muito", "super", "bem", "bastante", "demais", "realmente", "totalmente",
                    "literalmente", "absurdamente", "extremamente", "mega"]
# Marcas comuns de texto de IA em pt-BR (lista heurística, não validada): mede a LINHA DE
# BASE da pessoa. O que ela não usa vira "não fazer" no perfil; o que ela usa, fica.
MARCAS_IA = ["além disso", "vale ressaltar", "vale destacar", "é importante destacar",
             "é importante ressaltar", "no cenário atual", "em suma", "em resumo", "robusto",
             "robusta", "alavancar", "potencializar", "jornada", "mergulhar", "crucial",
             "fundamental", "transformador", "inovador", "sinergia", "ecossistema",
             "de forma eficiente", "nesse sentido", "desbloquear"]
NAO_X_MAS_Y = re.compile(r"\bnão (?:apenas|só|somente)\b.{3,80}?\bmas (?:também|sim)\b", re.I | re.S)
P1S = {"eu", "me", "mim", "comigo", "meu", "minha", "meus", "minhas"}
P1P = {"nós", "nos", "conosco", "nosso", "nossa", "nossos", "nossas"}
P2 = {"você", "vocês", "tu", "te", "ti", "contigo", "teu", "tua", "seu", "sua"}


def ler_entrevista(md):
    """Lista de respostas: {id, pergunta, tipo, modo, usos, texto}."""
    blocos, atual = [], None
    for linha in md.splitlines():
        t = TITULO.match(linha)
        if t:
            atual = {"id": t.group(1), "pergunta": t.group(2).strip(), "tipo": "aberta",
                     "modo": "digitado", "usos": [], "linhas": []}
            blocos.append(atual)
            continue
        if BLOCO.match(linha):
            atual = None
            continue
        if atual is None:
            continue
        m = META.search(linha)
        if m and ("modo:" in m.group(1) or "tipo:" in m.group(1)):
            for parte in m.group(1).split("·"):
                chave, _, valor = parte.partition(":")
                chave, valor = chave.strip(), valor.strip()
                if chave == "uso":
                    atual["usos"] = [u.strip() for u in valor.split(",") if u.strip()]
                elif chave in ("tipo", "modo"):
                    atual[chave] = valor
            continue
        atual["linhas"].append(linha)
    for b in blocos:
        b["texto"] = "\n".join(b.pop("linhas")).strip()
        if b["texto"] in VAZIO:
            b["texto"] = ""
    return blocos


def palavras(t):
    return [w.lower() for w in PALAVRA.findall(t)]


def por(c, d, k=1000.0):
    return round(c / d * k, 2) if d else 0.0


def contar_expressoes(texto_min, lista):
    out = {}
    for e in lista:
        n = len(re.findall(r"(?<![\w])" + re.escape(e) + r"(?![\w])", texto_min))
        if n:
            out[e] = n
    return out


def pistas_tempo(ws):
    """Heurística grosseira: terminação do verbo logo depois de 'eu'."""
    c = Counter()
    for a, b in zip(ws, ws[1:]):
        if a != "eu":
            continue
        if b in ("vou", "vamos"):
            c["futuro com ir (vou + infinitivo)"] += 1
        elif re.search(r"(arei|erei|irei)$", b):
            c["futuro simples"] += 1
        elif re.search(r"(ava|ia)$", b):
            c["pretérito imperfeito"] += 1
        elif re.search(r"(ei|i)$", b) or b in ("fiz", "fui", "tive", "disse", "pude", "quis", "vi", "estive", "soube"):
            c["pretérito perfeito"] += 1
        elif re.search(r"o$", b) or b in ("sou", "estou", "tenho", "faço", "sei", "vejo"):
            c["presente"] += 1
    return dict(c)


def mattr(ws, janela=50):
    if not ws:
        return 0.0
    if len(ws) < janela:
        return round(len(set(ws)) / len(ws), 3)
    vals = [len(set(ws[i:i + janela])) / janela for i in range(len(ws) - janela + 1)]
    return round(sum(vals) / len(vals), 3)


def conta_a_gente(texto):
    return sum(1 for m in A_GENTE.finditer(texto) if (m.group(1) or "").strip().lower() not in NAO_PRONOME)


def metricas(blocos):
    texto = "\n\n".join(b["texto"] for b in blocos)
    texto_ia = "\n\n".join(b["texto"] for b in blocos if b.get("id") not in IDS_VETOS).lower()
    tmin = texto.lower()
    ws = palavras(texto)
    n, chars = len(ws), len(texto)
    frases = [f for f in DIVIDE_FRASE.split(texto) if PALAVRA.search(f)]
    tam = [len(palavras(f)) for f in frases] or [0]
    densidade = por(sum(texto.count(c) for c in ".!?…"), n, 100)
    gramas = Counter()
    for b in blocos:
        t = palavras(b["texto"])
        for k in (2, 3):
            for i in range(len(t) - k + 1):
                g = t[i:i + k]
                if not all(x in VAZIAS for x in g):
                    gramas[" ".join(g)] += 1
    conteudo = Counter(w for w in ws if w not in VAZIAS and len(w) > 2)
    return {
        "respostas": len(blocos), "palavras": n,
        "palavras_por_resposta_mediana": statistics.median(len(palavras(b["texto"])) for b in blocos) if blocos else 0,
        "pontuacao_final_por_100_palavras": densidade,
        "frases_confiaveis": densidade >= 3,
        "frase_media": round(statistics.mean(tam), 1),
        "frase_mediana": statistics.median(tam),
        "frase_desvio": round(statistics.pstdev(tam), 1),
        "pct_frases_curtas_ate_8": por(sum(1 for x in tam if x <= 8), len(tam), 100),
        "pct_frases_longas_30_ou_mais": por(sum(1 for x in tam if x >= 30), len(tam), 100),
        "mattr_50": mattr(ws),
        "pessoa_por_1000_palavras": {
            "1a_singular": por(sum(w in P1S for w in ws), n),
            "1a_plural": por(sum(w in P1P for w in ws), n),
            "a_gente": por(conta_a_gente(texto), n),
            "2a": por(sum(w in P2 for w in ws), n),
        },
        "tempo_verbal_pistas": pistas_tempo(ws),
        "pct_frases_comecam_com_conjuncao": por(sum(1 for f in frases if re.match(r"\s*(e|mas|então|porque|aí|só que)\b", f, re.I)), len(frases), 100),
        "pct_frases_comecam_com_eu": por(sum(1 for f in frases if re.match(r"\s*eu\b", f, re.I)), len(frases), 100),
        "perguntas_por_100_frases": por(texto.count("?"), len(frases), 100),
        "pontuacao_por_1000_caracteres": {**{k: por(texto.count(k), chars) for k in ["!", "?", ";", ":", "(", "…", "..."]},
                                          "travessao": por(texto.count("—") + texto.count(" – "), chars)},
        "emoji": len(EMOJI.findall(texto)),
        # Contagem bruta: "aí", "então", "assim", "bom" também são usos gramaticais. Confira lendo.
        "marcadores_orais": contar_expressoes(tmin, ORAIS),
        "hesitacoes": contar_expressoes(tmin, HESITACOES),
        "intensificadores": contar_expressoes(tmin, INTENSIFICADORES),
        "linha_de_base_ia": {**contar_expressoes(texto_ia, MARCAS_IA), "nao_x_mas_y": len(NAO_X_MAS_Y.findall(texto_ia))},
        "repeticoes_imediatas": sum(1 for a, b in zip(ws, ws[1:]) if a == b and a not in ("muito", "bem")),
        "expressoes_frequentes": [g for g, c in gramas.most_common(300) if c >= 2][:20],
        "palavras_de_conteudo_mais_usadas": [w for w, _ in conteudo.most_common(25)],
    }


def idioma_da_entrevista(md):
    """'pt' (sem marcação, o padrão da página /voz) ou o valor de <!-- idioma: xx -->."""
    m = IDIOMA.search(md.split("\n###", 1)[0])
    return m.group(1).lower() if m else "pt"


def analisar(md):
    blocos = ler_entrevista(md)
    idioma = idioma_da_entrevista(md)
    reguas = {b["id"]: b["texto"].split("/")[0] for b in blocos if b["tipo"] == "regua" and b["texto"]}
    respostas = [b for b in blocos if b["tipo"] != "regua" and b["texto"]]
    vazias = [b["id"] for b in blocos if not b["texto"]]
    escrito = [b for b in respostas if b["modo"] in ("digitado", "colado")]
    ditado = [b for b in respostas if b["modo"] == "ditado"]
    out = {
        "resumo": {
            "idioma": idioma,
            "respondidas": [b["id"] for b in respostas], "sem_resposta": vazias,
            "modos": dict(Counter(b["modo"] for b in respostas)), "reguas": reguas,
        },
        "total": metricas(respostas),
    }
    if escrito:
        out["escrito"] = metricas(escrito)
    if ditado:
        out["ditado"] = metricas(ditado)
    total = out["total"]["palavras"]
    avisos = ["marcadores_orais é contagem bruta: 'aí', 'então', 'assim' e 'bom' também têm uso gramatical. "
              "Só vira traço o marcador que você confirmar lendo o escrito."]
    if idioma != "pt":
        avisos.append(f"Entrevista em '{idioma}': as listas deste script são de pt-BR. Ignore marcadores_orais, "
                      "hesitacoes, intensificadores, linha_de_base_ia, nao_x_mas_y, pessoa_por_1000_palavras, "
                      "tempo_verbal_pistas, pct_frases_comecam_com_*, expressoes_frequentes e "
                      "palavras_de_conteudo_mais_usadas. Valem só as de forma (frases, pontuação, travessão, "
                      "emoji, mattr_50, palavras). Tire vocabulário, pessoa gramatical e marcas de IA lendo.")
    if total < 2000:
        avisos.append(f"{total} palavras: abaixo de ~2.000, trate tudo como indício.")
    if not escrito:
        avisos.append("Nenhuma resposta escrita: ritmo e pontuação ficam 'a definir'. Peça um texto colado.")
    elif out["escrito"]["palavras"] < 150:
        avisos.append("Pouco texto escrito (<150 palavras): ritmo e pontuação são fracos.")
    out["avisos"] = avisos
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    with open(sys.argv[1], encoding="utf-8") as f:
        out = analisar(f.read())
    js = json.dumps(out, ensure_ascii=False, indent=2)
    if "--json" in sys.argv:
        with open(sys.argv[sys.argv.index("--json") + 1], "w", encoding="utf-8") as f:
            f.write(js)
    print(js)


if __name__ == "__main__":
    main()
