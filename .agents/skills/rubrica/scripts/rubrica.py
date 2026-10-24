#!/usr/bin/env python3
"""rubrica — lê e escreve no conteúdo de um site Rubrica pela linha de comando.

Fala com a HTTP API do Convex do projeto (POST /api/query|mutation|action)
usando o login de um usuário do admin (Convex Auth, provider "password").
Funciona em qualquer projeto criado com o Rubrica: descobre sozinho a pasta do
projeto, o Convex e o endereço do site.

Uso: python3 rubrica.py <subcomando> [opções]   (-h lista todos)

Saída: JSON no stdout (o agente lê), erros em português no stderr.
Códigos de saída: 0 ok · 1 erro do servidor/uso · 2 bloqueado pela skill ·
3 projeto/Convex não encontrado · 4 sem login/sessão expirada ·
5 sem permissão · 7 rede.
Só biblioteca padrão do Python 3.8+.
"""
import argparse
import base64
import getpass
import json
import mimetypes
import os
import re
import struct
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

AQUI = os.path.dirname(os.path.realpath(__file__))

# Irreversíveis: só pela interface do admin, nunca pela skill.
BLOQUEADAS = re.compile(r":(permanentDelete|requestErasure|bootstrapRootUser)$")

# tipo -> (função de listagem, args fixos, função de leitura, campo de leitura)
TIPOS = {
    "posts":       ("posts:listAdmin", {"limit": 200}, "posts:getBySlug", "slug"),
    "projetos":    ("projects:list", {}, "projects:getById", "id"),
    "propostas":   ("proposals:listAdmin", {"limit": 200}, None, None),
    "contatos":    ("contactRequests:list", {"limit": 200}, "contactRequests:get", "id"),
    "depoimentos": ("testimonials:list", {}, "testimonials:getById", "id"),
    "envios":      ("testimonialSubmissions:list", {}, None, None),
    "curriculo":   ("resumeItems:listAll", {}, None, None),
    "servicos":    ("services:list", {}, None, None),
    "faq":         ("aboutFaq:list", {}, None, None),
    "rotina":      ("aboutDailyRoutine:list", {}, None, None),
    "checkouts":   ("checkouts:listAdmin", {"limit": 200}, "checkouts:getByLink", "uniqueLink"),
    "imagens":     ("images:list", {"limit": 200}, "images:getById", "id"),
    "pastas":      ("imageFolders:tree", {}, None, None),
    "home":        ("homeContent:getAll", {}, "homeContent:getByKey", "key"),
    "ia-resumos":  ("aiResumes:list", {}, "aiResumes:getById", "id"),
    "contratos":   ("contractTemplates:list", {}, "contractTemplates:get", "id"),
    "usuarios":    ("users:list", {}, None, None),
}

# Campos aceitos por contactInfo:update (o "perfil" do site).
CAMPOS_PERFIL = {
    "name", "role", "roleTranslations", "email", "showEmail", "phone", "showPhone",
    "birthDate", "showBirthDate", "location", "showLocation", "avatarUrl",
    "avatarStorageId", "linkedinUrl", "githubUrl", "behanceUrl", "proposalIntro",
    "proposalAiContext",
}

CORES_TEMA = ("theme_background", "theme_foreground", "theme_primary", "theme_accent")
# Modo escuro. Com "theme_colors_per_mode" verdadeiro, CORES_TEMA vale só para o claro.
CORES_TEMA_ESCURO = ("theme_dark_background", "theme_dark_foreground", "theme_dark_primary", "theme_dark_accent")
POR_MODO = "theme_colors_per_mode"


def pares_texto_fundo(cfg):
    """(modo, contraste texto/fundo) de cada modo que tem as duas cores salvas."""
    pares = [("claro", cfg.get("theme_background"), cfg.get("theme_foreground"))]
    if cfg.get(POR_MODO) in (True, "true"):
        pares.append(("escuro", cfg.get("theme_dark_background"), cfg.get("theme_dark_foreground")))
    return [(m, contraste(f, t)) for m, f, t in pares if contraste(f, t) is not None]


class Falha(Exception):
    def __init__(self, msg, codigo=1):
        super().__init__(msg)
        self.codigo = codigo


def saida(obj):
    json.dump(obj, sys.stdout, ensure_ascii=False, indent=1)
    sys.stdout.write("\n")


# ------------------------------------------------------------------ projeto

def _sobe_ate(inicio, marca):
    d = os.path.abspath(inicio)
    while True:
        if os.path.isfile(os.path.join(d, marca)):
            return d
        pai = os.path.dirname(d)
        if pai == d:
            return None
        d = pai


def raiz_projeto():
    """Pasta do projeto Rubrica: RUBRICA_PROJECT, ou a primeira pasta com
    rubrica.config.ts subindo a partir do diretório atual ou do script."""
    env = os.environ.get("RUBRICA_PROJECT")
    if env:
        return os.path.abspath(os.path.expanduser(env))
    return _sobe_ate(os.getcwd(), "rubrica.config.ts") or _sobe_ate(AQUI, "rubrica.config.ts")


def ler_env(caminho):
    vals = {}
    try:
        with open(caminho, encoding="utf-8") as f:
            for linha in f:
                m = re.match(r"\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$", linha)
                if m:
                    v = m.group(2).split(" #")[0].strip().strip('"').strip("'")
                    vals[m.group(1)] = v
    except OSError:
        pass
    return vals


_CONVEX = None
_AMBIENTE = None

DESCRICAO_AMBIENTE = {"desenvolvimento": "de desenvolvimento", "local": "local (só nesta máquina)"}
AVISO_DEV = ("Este Convex é {amb}: o site no ar não muda. Para mexer no site publicado, "
             "defina RUBRICA_CONVEX_URL com a URL do Convex de produção.")


def ambiente():
    """produção | desenvolvimento | local | informado (RUBRICA_CONVEX_URL) | desconhecido."""
    convex()
    return _AMBIENTE


def _ambiente_do_deployment(dep):
    tipo = (dep or "").split(":", 1)[0]
    return {"prod": "produção", "dev": "desenvolvimento", "anonymous": "local",
            "local": "local"}.get(tipo, "desconhecido")


def convex():
    """(url, origem) do Convex usado. Ordem: RUBRICA_CONVEX_URL, depois
    VITE_CONVEX_URL/CONVEX_URL do .env.local do projeto."""
    global _CONVEX, _AMBIENTE
    if _CONVEX:
        return _CONVEX
    env = os.environ.get("RUBRICA_CONVEX_URL")
    if env:
        _CONVEX = (env.rstrip("/"), "variável RUBRICA_CONVEX_URL")
        _AMBIENTE = "informado em RUBRICA_CONVEX_URL"
        return _CONVEX
    raiz = raiz_projeto()
    if not raiz:
        raise Falha("Não achei o projeto Rubrica (nenhum rubrica.config.ts acima desta pasta). "
                    "Rode de dentro do projeto ou defina RUBRICA_PROJECT.", 3)
    vals = ler_env(os.path.join(raiz, ".env.local"))
    url = vals.get("VITE_CONVEX_URL") or vals.get("CONVEX_URL")
    if not url:
        raise Falha(f"Sem VITE_CONVEX_URL em {raiz}/.env.local. Rode `npx convex dev` no projeto "
                    "ou defina RUBRICA_CONVEX_URL com o endereço do Convex.", 3)
    _CONVEX = (url.rstrip("/"), f"{raiz}/.env.local")
    _AMBIENTE = _ambiente_do_deployment(vals.get("CONVEX_DEPLOYMENT"))
    return _CONVEX


def url_site():
    """Endereço público do site: site_url do Convex, senão o rubrica.config.ts."""
    try:
        for item in _post("query", "siteConfig:getPublic", {})[1].get("value") or []:
            if item.get("key") == "site_url" and item.get("value"):
                return str(item["value"]).rstrip("/")
    except Falha:
        pass
    raiz = raiz_projeto()
    if raiz:
        try:
            with open(os.path.join(raiz, "rubrica.config.ts"), encoding="utf-8") as f:
                m = re.search(r'siteUrl:\s*["\']([^"\']+)["\']', f.read())
                if m:
                    return m.group(1).rstrip("/")
        except OSError:
            pass
    return None


# ------------------------------------------------------------------ sessão

def pasta_sessoes():
    base = os.environ.get("XDG_CONFIG_HOME") or os.path.join(os.path.expanduser("~"), ".config")
    return os.path.join(base, "rubrica-skill")


def arquivo_sessao():
    """Uma sessão por Convex: o mesmo login serve para dev e prod só se a
    pessoa entrar nos dois."""
    host = urllib.parse.urlparse(convex()[0]).netloc or "convex"
    return os.path.join(pasta_sessoes(), re.sub(r"[^a-zA-Z0-9.-]", "_", host) + ".json")


def ler_sessao():
    try:
        with open(arquivo_sessao(), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def gravar_sessao(s):
    os.makedirs(pasta_sessoes(), mode=0o700, exist_ok=True)
    destino = arquivo_sessao()
    tmp = destino + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(s, f)
    os.replace(tmp, destino)


def claims(tok):
    try:
        parte = tok.split(".")[1]
        parte += "=" * (-len(parte) % 4)
        return json.loads(base64.urlsafe_b64decode(parte))
    except (IndexError, ValueError, AttributeError):
        return {}


def _post(tipo, caminho, args, tok=None):
    url = convex()[0]
    corpo = json.dumps({"path": caminho, "args": args, "format": "json"}).encode()
    headers = {"Content-Type": "application/json"}
    if tok:
        headers["Authorization"] = f"Bearer {tok}"
    req = urllib.request.Request(f"{url}/api/{tipo}", data=corpo, method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except ValueError:
            return e.code, {"status": "error", "errorMessage": f"HTTP {e.code}"}
    except (urllib.error.URLError, TimeoutError) as e:
        raise Falha(f"Falha de rede ao falar com o Convex ({url}): {e}", 7)


def _tokens(resp):
    v = resp.get("value") if resp.get("status") == "success" else None
    t = (v or {}).get("tokens") if isinstance(v, dict) else None
    if not t or not t.get("token"):
        return None
    return t


def renovar(s):
    _, resp = _post("action", "auth:signIn", {"refreshToken": s["refreshToken"]})
    t = _tokens(resp)
    if not t:
        raise Falha("A sessão expirou: faça o login de novo (veja `rubrica.py login -h`).", 4)
    s.update(token=t["token"], refreshToken=t["refreshToken"])
    gravar_sessao(s)
    return s


def token(forcar=False):
    s = ler_sessao()
    if not s or not s.get("token"):
        raise Falha(f"Sem login no Convex {convex()[0]}: faça o login (veja `rubrica.py login -h`).", 4)
    if forcar or claims(s["token"]).get("exp", 0) - time.time() < 60:
        s = renovar(s)
    return s["token"]


def _mensagem(resp):
    dado = resp.get("errorData")
    if isinstance(dado, str) and dado:
        return dado
    return resp.get("errorMessage") or resp.get("message") or "erro desconhecido"


_AVISOU = False


def avisar_ambiente():
    """Na primeira escrita, avisa no stderr quando o Convex não é o do site no ar."""
    global _AVISOU
    if _AVISOU:
        return
    _AVISOU = True
    amb = ambiente()
    if amb in ("desenvolvimento", "local"):
        sys.stderr.write(f"ℹ Gravando em {convex()[0]}. " + AVISO_DEV.format(amb=DESCRICAO_AMBIENTE[amb]) + "\n")


def chamar(tipo, caminho, args=None, _tentativa=0):
    if BLOQUEADAS.search(caminho):
        raise Falha(f"{caminho} é irreversível e fica fora da skill: faça pelo painel admin.", 2)
    if tipo != "query" and _tentativa == 0:
        avisar_ambiente()
    status, resp = _post(tipo, caminho, dict(args or {}), token(forcar=_tentativa == 1))
    if resp.get("status") == "success":
        return resp.get("value")
    msg = _mensagem(resp)
    if (status == 401 or "Unauthorized" in msg) and _tentativa == 0:
        return chamar(tipo, caminho, args, 1)
    if "Forbidden" in msg:
        raise Falha(f"Sem permissão para {caminho}: {msg}", 5)
    if "Unauthorized" in msg or status == 401:
        raise Falha("O Convex recusou o login: faça o login de novo.", 4)
    raise Falha(f"{caminho}: {msg}")


# ------------------------------------------------------------------ utilidades

GRANDES = {"content", "longDescription", "contentSnapshot", "signatureDataUrl"}


def enxuto(obj, limite=160):
    """Versão curta de um documento para listagens."""
    if isinstance(obj, list):
        return [enxuto(x, limite) for x in obj]
    if not isinstance(obj, dict):
        return obj
    out = {}
    for k, v in obj.items():
        if k in GRANDES or k.endswith("Translations") or k == "_creationTime":
            continue
        if isinstance(v, str) and len(v) > limite:
            v = v[:limite] + "…"
        elif isinstance(v, (int, float)) and k.endswith("At") and v > 1e12:
            v = time.strftime("%Y-%m-%d %H:%M", time.localtime(v / 1000))
        elif isinstance(v, (dict, list)):
            v = enxuto(v, limite)
        out[k] = v
    return out


def ler_arquivo(caminho):
    try:
        with open(caminho, encoding="utf-8") as f:
            return f.read()
    except OSError as e:
        raise Falha(f"Não consegui ler {caminho}: {e}")


def ler_json(caminho=None, bruto=None):
    texto = ler_arquivo(caminho) if caminho else (bruto or "")
    try:
        return json.loads(texto)
    except ValueError as e:
        raise Falha(f"JSON inválido ({caminho or 'argumento'}): {e}")


def args_json(a):
    v = ler_json(a.args_arquivo) if a.args_arquivo else ler_json(bruto=a.args or "{}")
    if not isinstance(v, dict):
        raise Falha("--args precisa ser um objeto JSON.")
    return v


def chaves_publicas_config():
    """PUBLIC_KEYS de convex/siteConfig.ts (fonte de verdade do projeto)."""
    raiz = raiz_projeto()
    if raiz:
        try:
            texto = ler_arquivo(os.path.join(raiz, "convex", "siteConfig.ts"))
            bloco = re.search(r"PUBLIC_KEYS\s*=\s*\[(.*?)\]", texto, re.S)
            if bloco:
                return set(re.findall(r'"([a-z0-9_]+)"', bloco.group(1)))
        except Falha:
            pass
    return None


# ------------------------------------------------------------------ contraste

def _rgb(cor):
    cor = (cor or "").strip()
    m = re.fullmatch(r"#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})", cor)
    if m:
        h = m.group(1)
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    m = re.fullmatch(r"rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+).*\)", cor)
    if m:
        return tuple(int(x) for x in m.groups())
    return None


def contraste(a, b):
    """Razão de contraste WCAG entre duas cores (None se não souber ler)."""
    ca, cb = _rgb(a), _rgb(b)
    if not ca or not cb:
        return None

    def lum(c):
        def canal(x):
            x /= 255
            return x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
        r, g, b_ = (canal(x) for x in c)
        return 0.2126 * r + 0.7152 * g + 0.0722 * b_

    la, lb = sorted((lum(ca), lum(cb)), reverse=True)
    return round((la + 0.05) / (lb + 0.05), 2)


# ------------------------------------------------------------------ imagens

MIMES_IMAGEM = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
                ".avif": "image/avif"}
LIMITE_IMAGEM = 10 * 1024 * 1024


def dimensoes(dados):
    """Largura e altura de PNG, JPEG, GIF e WebP (None se não souber ler)."""
    try:
        if dados[:8] == b"\x89PNG\r\n\x1a\n":
            return struct.unpack(">II", dados[16:24])
        if dados[:6] in (b"GIF87a", b"GIF89a"):
            return struct.unpack("<HH", dados[6:10])
        if dados[:4] == b"RIFF" and dados[8:12] == b"WEBP":
            tipo = dados[12:16]
            if tipo == b"VP8 ":
                w, h = struct.unpack("<HH", dados[26:30])
                return w & 0x3FFF, h & 0x3FFF
            if tipo == b"VP8L":
                b = dados[21:25]
                return (1 + (((b[1] & 0x3F) << 8) | b[0]),
                        1 + (((b[3] & 0xF) << 10) | (b[2] << 2) | ((b[1] & 0xC0) >> 6)))
            if tipo == b"VP8X":
                return (1 + int.from_bytes(dados[24:27], "little"),
                        1 + int.from_bytes(dados[27:30], "little"))
        if dados[:2] == b"\xff\xd8":
            i = 2
            while i < len(dados) - 9:
                if dados[i] != 0xFF:
                    i += 1
                    continue
                marca = dados[i + 1]
                if marca in (0xD8, 0x01) or 0xD0 <= marca <= 0xD7:
                    i += 2
                    continue
                tam = struct.unpack(">H", dados[i + 2:i + 4])[0]
                if marca in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    h, w = struct.unpack(">HH", dados[i + 5:i + 9])
                    return w, h
                i += 2 + tam
    except (struct.error, IndexError):
        pass
    return None


def subir_imagem(caminho, nome=None, alt=None, descricao=None, tags=None, pasta=None):
    """Sobe um arquivo para o storage do Convex e registra na biblioteca de
    imagens do admin. Devolve {id, storageId, url, ...}."""
    ext = os.path.splitext(caminho)[1].lower()
    mime = MIMES_IMAGEM.get(ext) or mimetypes.guess_type(caminho)[0] or ""
    if not mime.startswith("image/"):
        raise Falha(f"{caminho} não parece ser uma imagem (aceito: {', '.join(sorted(MIMES_IMAGEM))}).")
    try:
        with open(caminho, "rb") as f:
            dados = f.read()
    except OSError as e:
        raise Falha(f"Não consegui ler {caminho}: {e}")
    if not dados:
        raise Falha(f"{caminho} está vazio.")
    if len(dados) > LIMITE_IMAGEM:
        raise Falha(f"{caminho} tem {len(dados) / 1048576:.1f} MB; o limite é 10 MB. Comprima antes.")

    url_upload = chamar("mutation", "images:generateUploadUrl")
    req = urllib.request.Request(url_upload, data=dados, method="POST", headers={"Content-Type": mime})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            storage_id = json.loads(r.read() or b"{}").get("storageId")
    except urllib.error.HTTPError as e:
        raise Falha(f"O storage do Convex recusou o upload (HTTP {e.code}).")
    except (urllib.error.URLError, TimeoutError) as e:
        raise Falha(f"Falha de rede no upload da imagem: {e}", 7)
    if not storage_id:
        raise Falha("O upload não devolveu storageId.")

    args = {"storageId": storage_id,
            "displayName": nome or os.path.splitext(os.path.basename(caminho))[0],
            "fileSize": len(dados), "mimeType": mime}
    dim = dimensoes(dados)
    if dim:
        args["width"], args["height"] = int(dim[0]), int(dim[1])
    if alt:
        args["altText"] = alt
    if descricao:
        args["description"] = descricao
    if tags:
        args["tags"] = [t.strip() for t in tags.split(",") if t.strip()]
    if pasta:
        args["folderId"] = pasta
    img_id = chamar("mutation", "images:create", args)
    img = chamar("query", "images:getById", {"id": img_id}) or {}
    return {"id": img_id, "storageId": storage_id, "url": img.get("url"),
            "nome": args["displayName"], "alt": alt, "largura": args.get("width"),
            "altura": args.get("height"), "bytes": len(dados), "mime": mime}


def resolver_capa(a, args):
    if a.capa and a.imagem_id:
        raise Falha("Use --capa ou --imagem-id, não os dois.")
    if a.capa:
        img = subir_imagem(a.capa, alt=a.capa_alt)
        args["imageId"] = img["id"]
        return img
    if a.imagem_id:
        args["imageId"] = a.imagem_id
    return None


# ------------------------------------------------------------------ sessão: comandos

def c_login(a):
    email = a.email or input("E-mail do admin: ").strip()
    if a.senha_stdin:
        senha = sys.stdin.readline().rstrip("\n")
    else:
        if not sys.stdin.isatty():
            raise Falha("Sem terminal para digitar a senha. Rode o login num terminal seu, "
                        "ou passe a senha por stdin com --senha-stdin.", 4)
        senha = getpass.getpass("Senha: ")
    _, resp = _post("action", "auth:signIn", {
        "provider": "password", "params": {"email": email, "password": senha, "flow": "signIn"}})
    t = _tokens(resp)
    if not t:
        raise Falha("Login recusado: e-mail ou senha inválidos (ou muitas tentativas; espere uns minutos).", 4)
    gravar_sessao({"email": email, "token": t["token"], "refreshToken": t["refreshToken"]})
    papel = chamar("query", "users:getMyRole")
    saida({"ok": True, "conta": email, "convex": convex()[0], "ambiente": ambiente(),
           "papel": (papel or {}).get("role") if isinstance(papel, dict) else papel})


def c_status(a):
    url, origem = convex()
    amb = ambiente()
    base = {"projeto": raiz_projeto(), "convex": url, "convexOrigem": origem, "ambiente": amb,
            "site": url_site()}
    if amb in ("desenvolvimento", "local"):
        base["aviso"] = AVISO_DEV.format(amb=DESCRICAO_AMBIENTE[amb])
    elif amb == "desconhecido":
        base["aviso"] = ("Não deu para saber se este Convex é de produção ou de desenvolvimento "
                         "(sem CONVEX_DEPLOYMENT no .env.local). Confirme com a pessoa antes de gravar.")
    s = ler_sessao()
    if not s:
        saida({**base, "logado": False})
        return
    papel = chamar("query", "users:getMyRole")
    saida({**base, "logado": True, "conta": s.get("email"),
           "papel": (papel or {}).get("role") if isinstance(papel, dict) else papel,
           "publicacao": enxuto(chamar("query", "publishStatus:get"))})


def c_logout(a):
    s = ler_sessao()
    if s:
        try:
            _post("action", "auth:signOut", {}, s.get("token"))
        except Falha:
            pass
        os.remove(arquivo_sessao())
    saida({"ok": True})


# ------------------------------------------------------------------ leitura

def c_painel(a):
    res = {"dashboard": chamar("query", "stats:getDashboard"),
           "publicacao": enxuto(chamar("query", "publishStatus:get"))}
    for chave, caminho, args in (("contatosNovos", "contactRequests:list", {"status": "new", "limit": 50}),
                                 ("depoimentosPendentes", "testimonialSubmissions:list", {"status": "pending"})):
        try:
            itens = chamar("query", caminho, args)
            res[chave] = {"total": len(itens), "itens": enxuto(itens, 80)[:10]}
        except Falha as e:
            res[chave] = {"erro": str(e)}
    saida(res)


def c_listar(a):
    caminho, args, _, _ = TIPOS[a.tipo]
    args = dict(args)
    if a.status:
        args["status" if a.tipo != "propostas" else "filter"] = a.status
    if a.lixeira:
        args["includeDeleted"] = True
    itens = chamar("query", caminho, args)
    if isinstance(itens, dict) and "page" in itens:
        itens = itens["page"]
    if a.texto and isinstance(itens, list):
        t = a.texto.lower()
        itens = [x for x in itens if t in json.dumps(x, ensure_ascii=False).lower()]
    total = len(itens) if isinstance(itens, list) else None
    if isinstance(itens, list):
        itens = itens[: a.limite]
    saida({"tipo": a.tipo, "total": total, "itens": itens if a.completo else enxuto(itens)})


def c_ler(a):
    _, _, caminho, campo = TIPOS[a.tipo]
    if not caminho:
        lista_caminho, args, _, _ = TIPOS[a.tipo]
        itens = chamar("query", lista_caminho, {**args, "includeDeleted": True}
                       if a.tipo not in ("usuarios", "envios") else args)
        achado = [x for x in itens if a.ref in (x.get("_id"), x.get("slug"))]
        if not achado:
            raise Falha(f"Nada em {a.tipo} com id/slug {a.ref}.")
        saida(achado[0])
        return
    if a.tipo == "posts" and re.fullmatch(r"[a-z0-9]{32}", a.ref):
        itens = chamar("query", "posts:listAdmin", {"limit": 500, "includeDeleted": True})
        achado = [x for x in itens if x.get("_id") == a.ref]
        if not achado:
            raise Falha(f"Post {a.ref} não encontrado.")
        saida(achado[0])
        return
    saida(chamar("query", caminho, {campo: a.ref}))


# ------------------------------------------------------------------ textos do site

def todos_textos():
    return chamar("query", "siteTexts:getAll") or []


def c_textos(a):
    itens = todos_textos()
    if a.paginas:
        cont = {}
        for x in itens:
            p = cont.setdefault(x.get("page"), {"textos": 0, "semIngles": 0})
            p["textos"] += 1
            p["semIngles"] += 0 if x.get("enUS") else 1
        saida({"total": len(itens), "paginas": dict(sorted(cont.items()))})
        return
    if a.pagina:
        itens = [x for x in itens if x.get("page") == a.pagina]
    if a.chave:
        itens = [x for x in itens if x.get("key", "").startswith(a.chave)]
    if a.texto:
        t = a.texto.lower()
        itens = [x for x in itens if t in (x.get("ptBR") or "").lower() or t in (x.get("enUS") or "").lower()
                 or t in x.get("key", "").lower()]
    if a.sem_ingles:
        itens = [x for x in itens if not x.get("enUS")]
    itens = sorted(itens, key=lambda x: x.get("key", ""))
    total = len(itens)
    saida({"total": total,
           "itens": [{"key": x.get("key"), "page": x.get("page"), "ptBR": x.get("ptBR"),
                      "enUS": x.get("enUS")} for x in itens[: a.limite]],
           **({"aviso": f"Mostrando {a.limite} de {total}; use --limite ou filtre."} if total > a.limite else {})})


def _aplicar_textos(edicoes, so_pt, gravar=True):
    """Valida tudo antes de gravar qualquer coisa; depois grava um por um.
    Com gravar=False só valida e devolve o antes/depois."""
    atuais = {x["key"]: x for x in todos_textos()}
    if not atuais:
        raise Falha("O Convex não tem textos do site (tabela siteTexts vazia). O plugin i18n "
                    "está ligado e o seed rodou? (`npx convex run siteTexts:seed`)")
    erros = []
    for i, e in enumerate(edicoes):
        if not isinstance(e, dict) or not e.get("key") or not isinstance(e.get("ptBR"), str):
            erros.append(f"item {i}: precisa de key e ptBR")
            continue
        if e["key"] not in atuais:
            erros.append(f"{e['key']}: chave não existe (veja `textos --chave`)")
        if not so_pt and not e.get("enUS"):
            erros.append(f"{e['key']}: faltou enUS (traduza, ou use --so-pt)")
    if erros:
        raise Falha("Nada foi gravado. Corrija: " + "; ".join(erros))
    feitos = []
    for e in edicoes:
        antes = atuais[e["key"]]
        en = e.get("enUS") or antes.get("enUS")
        args = {"key": e["key"], "ptBR": e["ptBR"]}
        if en:
            args["enUS"] = en
        if gravar:
            chamar("mutation", "siteTexts:update", args)
        feitos.append({"key": e["key"],
                       "antes": {"ptBR": antes.get("ptBR"), "enUS": antes.get("enUS")},
                       "depois": {"ptBR": e["ptBR"], "enUS": en},
                       **({"aviso": "enUS mantido do valor anterior; pode ter ficado desatualizado"}
                          if not e.get("enUS") and antes.get("enUS") else {})})
    return feitos


def c_texto_editar(a):
    feitos = _aplicar_textos([{"key": a.chave, "ptBR": a.pt, "enUS": a.en}], a.so_pt)
    saida({"ok": True, "alterados": feitos,
           "aviso": "O site lê os textos ao vivo: a mudança já aparece. publicar-site só é preciso para o HTML estático/SEO."})


def c_textos_editar(a):
    edicoes = ler_json(a.arquivo)
    if not isinstance(edicoes, list):
        raise Falha("O arquivo precisa ser uma lista JSON: [{\"key\", \"ptBR\", \"enUS\"}, ...].")
    feitos = _aplicar_textos(edicoes, a.so_pt)
    saida({"ok": True, "total": len(feitos), "alterados": feitos})


# ------------------------------------------------------------------ configuração do site

def c_config(a):
    itens = chamar("query", "siteConfig:getAll") or []
    cfg = {x["key"]: x.get("value") for x in itens}
    res = {"config": dict(sorted(cfg.items()))}
    cores = {k: cfg.get(k) for k in CORES_TEMA + CORES_TEMA_ESCURO if cfg.get(k)}
    if cores:
        res["cores"] = cores
        res["coresPorModo"] = cfg.get(POR_MODO) in (True, "true")
        pares = pares_texto_fundo(cfg)
        if pares:
            res["contrasteTextoFundo"] = {m: c for m, c in pares}
    saida(res)


def c_config_definir(a):
    itens = []
    for par in a.item or []:
        if "=" not in par:
            raise Falha(f"--item espera chave=valor, veio {par!r}.")
        k, v = par.split("=", 1)
        itens.append({"key": k.strip(), "value": v})
    if a.arquivo:
        dado = ler_json(a.arquivo)
        if isinstance(dado, dict):
            dado = [{"key": k, "value": v} for k, v in dado.items()]
        if not isinstance(dado, list):
            raise Falha("--arquivo precisa ser {chave: valor} ou [{key, value}].")
        itens.extend(dado)
    if not itens:
        raise Falha("Passe --item chave=valor (repetível) ou --arquivo.")
    itens, atual, pares = _validar_config(itens, a.aceitar_contraste)
    c = {m: v for m, v in pares} or None
    chamar("mutation", "siteConfig:setBatch", {"items": itens})
    saida({"ok": True,
           "alterado": {i["key"]: {"antes": atual.get(i["key"]), "depois": i["value"]} for i in itens},
           **({"contrasteTextoFundo": c} if c else {}),
           "aviso": "Cores valem na hora. Título, descrição, SEO e RSS entram no HTML no próximo publicar-site."})


def _validar_config(itens, aceitar_contraste=False):
    """Confere chaves e contraste sem gravar. Devolve (itens, valores atuais, pares de contraste)."""
    validas = chaves_publicas_config()
    if validas:
        ruins = [i["key"] for i in itens if i["key"] not in validas]
        if ruins:
            raise Falha(f"Chaves desconhecidas: {', '.join(ruins)}. Válidas: {', '.join(sorted(validas))}. "
                        "Para a imagem de compartilhamento use `og-imagem`.")
    atual = {x["key"]: x.get("value") for x in (chamar("query", "siteConfig:getAll") or [])}
    novo = {**atual, **{i["key"]: i["value"] for i in itens}}
    if any(i["key"] in CORES_TEMA_ESCURO for i in itens) and novo.get(POR_MODO) not in (True, "true"):
        # Cor do escuro só vale com as cores separadas por modo: liga junto.
        itens.append({"key": POR_MODO, "value": True})
        novo[POR_MODO] = True
    pares = pares_texto_fundo(novo)
    ruins = [(m, c) for m, c in pares if c < 4.5]
    if ruins and not aceitar_contraste:
        m, c = ruins[0]
        raise Falha(f"No modo {m}, o texto sobre o fundo fica com contraste {c}:1 (mínimo WCAG AA: 4.5:1). Nada foi gravado. "
                    "Ajuste as cores ou passe --aceitar-contraste se a pessoa quiser assim mesmo.")
    return itens, atual, pares


def c_og_imagem(a):
    img = subir_imagem(a.arquivo, nome=a.nome or "og-image", alt=a.alt)
    chamar("mutation", "siteConfig:setOgImage", {"storageId": img["storageId"]})
    saida({"ok": True, "imagem": img,
           "aviso": "Imagem de compartilhamento trocada. Vale no próximo publicar-site. Ideal: 1200x630."})


# ------------------------------------------------------------------ perfil, home, plugins

def c_perfil(a):
    saida(chamar("query", "contactInfo:get"))


def c_perfil_editar(a):
    dados = ler_json(a.arquivo) if a.arquivo else ler_json(bruto=a.json or "")
    if not isinstance(dados, dict) or not dados:
        raise Falha("Passe um objeto JSON com os campos a mudar (--json ou --arquivo).")
    ruins = sorted(set(dados) - CAMPOS_PERFIL)
    if ruins:
        raise Falha(f"Campos desconhecidos: {', '.join(ruins)}. Aceitos: {', '.join(sorted(CAMPOS_PERFIL))}.")
    if "role" in dados and "roleTranslations" not in dados and not a.so_pt:
        raise Falha("Mudou role: mande roleTranslations {ptBR, enUS} junto, ou use --so-pt.")
    antes = chamar("query", "contactInfo:get") or {}
    chamar("mutation", "contactInfo:update", dados)
    saida({"ok": True, "alterado": {k: {"antes": antes.get(k), "depois": v} for k, v in dados.items()},
           "aviso": "O perfil entra no site estático no próximo publicar-site."})


def c_home_definir(a):
    if a.chave.startswith("plugin:"):
        raise Falha("Plugins se ligam com o comando `plugin`, não por home-definir.")
    valor = ler_json(a.arquivo) if a.arquivo else ler_json(bruto=a.valor)
    antes = chamar("query", "homeContent:getByKey", {"key": a.chave})
    chamar("mutation", "homeContent:set", {"key": a.chave, "value": valor})
    saida({"ok": True, "chave": a.chave, "antes": (antes or {}).get("value"), "depois": valor})


def c_plugins(a):
    saida(chamar("query", "plugins:getPluginStates"))


def c_plugin(a):
    estados = chamar("query", "plugins:getPluginStates") or {}
    if a.id not in estados:
        raise Falha(f"Plugin {a.id} não existe. Plugins: {', '.join(sorted(estados))}.")
    ligar = a.acao == "ligar"
    chamar("mutation", "plugins:setPluginEnabled", {"pluginId": a.id, "enabled": ligar})
    saida({"ok": True, "plugin": a.id, "antes": estados[a.id], "depois": ligar})


# ------------------------------------------------------------------ blog

def exigir_ingles(a, pares):
    if a.so_pt:
        return
    faltando = [en for pt, en in pares if getattr(a, pt) and not getattr(a, en.replace("-", "_"))]
    if faltando:
        raise Falha("Faltou a versão em inglês: " + ", ".join("--" + f for f in faltando)
                    + ". Traduza e passe junto, ou use --so-pt para gravar só em português.")


PARES_POST = (("titulo", "en-titulo"), ("subtitulo", "en-subtitulo"), ("arquivo", "en-arquivo"))


def c_post_criar(a):
    exigir_ingles(a, PARES_POST)
    conteudo = ler_arquivo(a.arquivo)
    args = {"title": a.titulo, "slug": a.slug, "content": conteudo,
            "tags": [t.strip() for t in (a.tags or "").split(",") if t.strip()],
            "featured": a.destaque, "status": "draft"}
    if a.subtitulo:
        args["subtitle"] = a.subtitulo
    if a.imagem_url:
        args["imageUrl"] = a.imagem_url
    if a.leitura:
        args["readTime"] = a.leitura
    if a.en_titulo:
        args["titleTranslations"] = {"ptBR": a.titulo, "enUS": a.en_titulo}
    if a.en_subtitulo:
        args["subtitleTranslations"] = {"ptBR": a.subtitulo or "", "enUS": a.en_subtitulo}
    if a.en_arquivo:
        args["contentTranslations"] = {"ptBR": conteudo, "enUS": ler_arquivo(a.en_arquivo)}
    capa = resolver_capa(a, args)
    novo = chamar("mutation", "posts:create", args)
    saida({"ok": True, "id": novo, "status": "draft", "slug": a.slug,
           **({"capa": capa} if capa else {}),
           "aviso": "Criado como rascunho. Para ir ao ar: post-publicar e depois publicar-site."})


def c_post_editar(a):
    exigir_ingles(a, PARES_POST)
    args = {"id": a.id}
    for campo, valor in (("title", a.titulo), ("subtitle", a.subtitulo), ("slug", a.slug),
                         ("imageUrl", a.imagem_url), ("readTime", a.leitura)):
        if valor is not None:
            args[campo] = valor
    if a.arquivo:
        args["content"] = ler_arquivo(a.arquivo)
    if a.tags is not None:
        args["tags"] = [t.strip() for t in a.tags.split(",") if t.strip()]
    if a.destaque is not None:
        args["featured"] = a.destaque == "sim"
    if a.en_titulo:
        if not a.titulo:
            raise Falha("--en-titulo exige --titulo junto (a tradução grava as duas versões).")
        args["titleTranslations"] = {"ptBR": a.titulo, "enUS": a.en_titulo}
    if a.en_subtitulo:
        if not a.subtitulo:
            raise Falha("--en-subtitulo exige --subtitulo junto.")
        args["subtitleTranslations"] = {"ptBR": a.subtitulo, "enUS": a.en_subtitulo}
    if a.en_arquivo:
        if "content" not in args:
            raise Falha("--en-arquivo exige --arquivo junto.")
        args["contentTranslations"] = {"ptBR": args["content"], "enUS": ler_arquivo(a.en_arquivo)}
    capa = resolver_capa(a, args)
    if len(args) == 1:
        raise Falha("Nada para editar: passe ao menos um campo.")
    chamar("mutation", "posts:update", args)
    saida({"ok": True, "id": a.id, "campos": sorted(k for k in args if k != "id"),
           **({"capa": capa} if capa else {}),
           "aviso": "Alteração gravada. O site só muda depois de publicar-site."})


def c_post_status(a):
    chamar("mutation", "posts:publish" if a.cmd == "post-publicar" else "posts:unpublish", {"id": a.id})
    saida({"ok": True, "id": a.id, "acao": a.cmd,
           "aviso": "O site estático só reflete depois de publicar-site."})


def c_imagem_subir(a):
    res = []
    for caminho in a.arquivos:
        um = len(a.arquivos) == 1
        img = subir_imagem(caminho, a.nome if um else None, a.alt if um else None,
                           a.descricao, a.tags, a.pasta)
        alt = (img["alt"] or "").replace('"', "&quot;")
        img["html"] = f'<img src="{img["url"]}" alt="{alt}">'
        img["arquivo"] = caminho
        res.append(img)
    saida({"ok": True, "imagens": res,
           "aviso": "Na biblioteca do admin. Capa: --imagem-id <id> no post-criar/post-editar. "
                    "Corpo: use o campo html no HTML do post."})


def c_contato(a):
    if not (a.status or a.nota):
        raise Falha("Passe --status e/ou --nota.")
    if a.status:
        chamar("mutation", "contactRequests:updateStatus", {"id": a.id, "status": a.status})
    if a.nota:
        chamar("mutation", "contactRequests:addNote", {"id": a.id, "note": a.nota})
    saida({"ok": True, "id": a.id})


# ------------------------------------------------------------------ publicação e genéricos

def c_publicar_site(a):
    antes = chamar("query", "publishStatus:get") or {}
    if a.verificar:
        saida({"pendente": bool(antes.get("pendingChanges")), "publicacao": enxuto(antes)})
        return
    if not antes.get("pendingChanges"):
        saida({"ok": True, "skipped": True, "mensagem": "Nada pendente para publicar."})
        return
    res = chamar("action", "deploy:trigger")
    saida({**(res or {}), "site": url_site(),
           "aviso": "Rebuild disparado na Vercel; o site atualiza em alguns minutos."})


def c_chamar(a):
    saida(chamar(a.tipo, a.caminho, args_json(a)))


def _chaves_balanceadas(texto, inicio):
    """Trecho de texto[inicio] == '{' até a chave que fecha."""
    nivel = 0
    for i in range(inicio, len(texto)):
        if texto[i] == "{":
            nivel += 1
        elif texto[i] == "}":
            nivel -= 1
            if nivel == 0:
                return texto[inicio:i + 1]
    return texto[inicio:]


def _args_da_funcao(corpo, texto):
    """O validador `args` da função, com objetos aninhados; resolve `args: nomeDaConst`."""
    m = re.search(r"args:\s*", corpo)
    if not m:
        return "{}"
    resto = corpo[m.end():]
    if resto.startswith("{"):
        return _chaves_balanceadas(resto, 0)
    nome = re.match(r"(\w+)", resto)
    if not nome:
        return "{}"
    const = re.search(r"^(?:export )?const " + nome.group(1) + r"\s*=\s*", texto, re.M)
    if const and texto[const.end():const.end() + 1] == "{":
        return _chaves_balanceadas(texto, const.end())
    return nome.group(1)


def c_funcoes(a):
    """Funções públicas do Convex lidas do próprio projeto (args e papéis)."""
    raiz = raiz_projeto()
    pasta = os.path.join(raiz or "", "convex")
    if not raiz or not os.path.isdir(pasta):
        raise Falha("Pasta convex/ do projeto não encontrada (rode de dentro do projeto ou defina RUBRICA_PROJECT).", 3)
    res = []
    padrao = re.compile(r"^export const (\w+) = (query|mutation|action)\(", re.M)
    for nome in sorted(os.listdir(pasta)):
        if not nome.endswith(".ts") or nome.startswith("_"):
            continue
        modulo = nome[:-3]
        if a.modulo and a.modulo != modulo:
            continue
        texto = ler_arquivo(os.path.join(pasta, nome))
        marcas = list(padrao.finditer(texto))
        for i, m in enumerate(marcas):
            corpo = texto[m.start(): marcas[i + 1].start() if i + 1 < len(marcas) else len(texto)]
            papeis = re.search(r"requireRole\(ctx,\s*(\[[^\]]*\]|\w+)", corpo)
            item = {"funcao": f"{modulo}:{m.group(1)}", "tipo": m.group(2),
                    "papeis": papeis.group(1) if papeis else ("login" if "requireAuth" in corpo else "público")}
            if a.modulo:
                item["args"] = _args_da_funcao(corpo, texto)
            res.append(item)
    saida({"projeto": raiz, "funcoes": res})


# ------------------------------------------------------------------ planos (aplicar-plano)
#
# As skills rubrica-* (case, apresentação, currículo, blog) montam o conteúdo e
# entregam um plano em JSON. Este comando valida o plano inteiro antes de gravar,
# mostra o antes/depois e grava passo a passo, guardando o progresso ao lado do
# plano para poder retomar. Formato em references/plano.md.

ACOES_PLANO = ("textos", "config", "perfil", "home", "imagem", "post-criar", "mutation")

# Fora de plano: acesso, dinheiro, tradutor pago e plugins pedem conversa, não plano.
PLANO_PROIBIDAS = re.compile(
    r"^(users:|checkouts:|payments?:|asaas:|plugins:)|"
    r":(resetPassword|translateBatch|translateAllMissing|permanentDelete|requestErasure|bootstrapRootUser)$")

REF = re.compile(r"\{\{\s*([A-Za-z0-9_-]+)\.([A-Za-z0-9_]+)\s*\}\}")


def _resolver_refs(valor, refs, pendente_ok=False):
    """Troca {{passo.campo}} pelo resultado de um passo anterior.
    Um valor que é só a referência mantém o tipo (ex.: id); dentro de um texto vira texto."""
    if isinstance(valor, dict):
        return {k: _resolver_refs(v, refs, pendente_ok) for k, v in valor.items()}
    if isinstance(valor, list):
        return [_resolver_refs(v, refs, pendente_ok) for v in valor]
    if not isinstance(valor, str) or "{{" not in valor:
        return valor

    def busca(m):
        passo, campo = m.group(1), m.group(2)
        if passo in refs and campo in refs[passo]:
            return refs[passo][campo]
        if pendente_ok:
            return f"(definido ao aplicar: {{{{{passo}.{campo}}}}})"
        raise Falha(f"Referência {{{{{passo}.{campo}}}}} sem valor: o passo '{passo}' não devolveu '{campo}'.")

    inteiro = REF.fullmatch(valor.strip())
    if inteiro:
        return busca(inteiro)
    return REF.sub(lambda m: str(busca(m)), valor)


def _trocar_no_arquivo(texto, refs):
    """No corpo de um HTML só troca {{passo.campo}} de passos que existem: um post sobre
    Vue ou Handlebars pode ter {{user.name}} de verdade no texto."""
    return REF.sub(lambda m: str(refs[m.group(1)][m.group(2)])
                   if m.group(1) in refs and m.group(2) in refs[m.group(1)] else m.group(0), texto)


def _refs_usadas(valor):
    if isinstance(valor, dict):
        return [r for v in valor.values() for r in _refs_usadas(v)]
    if isinstance(valor, list):
        return [r for v in valor for r in _refs_usadas(v)]
    if isinstance(valor, str):
        return [m.group(1) for m in REF.finditer(valor)]
    return []


def _mutation_existe(funcao):
    """True/False conforme convex/<modulo>.ts exporta a mutation; None se não der para saber."""
    raiz = raiz_projeto()
    modulo, nome = funcao.split(":", 1)
    arq = os.path.join(raiz or "", "convex", modulo + ".ts")
    if not raiz or not os.path.isfile(arq):
        return None if not raiz else False
    return re.search(r"^export const " + re.escape(nome) + r" = mutation\(", ler_arquivo(arq), re.M) is not None


def _faltas_ingles(valor, caminho=""):
    """Caminhos de campos *Translations que têm ptBR e não têm enUS."""
    faltas = []
    if isinstance(valor, dict):
        for k, v in valor.items():
            aqui = f"{caminho}.{k}" if caminho else k
            if k.endswith("Translations") and isinstance(v, dict) and v.get("ptBR") not in (None, "") \
                    and v.get("enUS") in (None, ""):
                faltas.append(aqui)
            faltas.extend(_faltas_ingles(v, aqui))
    elif isinstance(valor, list):
        for i, v in enumerate(valor):
            faltas.extend(_faltas_ingles(v, f"{caminho}[{i}]"))
    return faltas


def _tags(valor):
    """Aceita lista ou texto separado por vírgulas."""
    if isinstance(valor, str):
        return [t.strip() for t in valor.split(",") if t.strip()]
    return [str(t).strip() for t in (valor or []) if str(t).strip()]


def _caminho_plano(base, rel):
    return rel if os.path.isabs(rel) else os.path.normpath(os.path.join(base, rel))


def _validar_estrutura_plano(plano, base):
    """Checagens que não precisam do Convex. Levanta Falha com todos os erros juntos."""
    if not isinstance(plano, dict) or plano.get("rubricaPlano") != 1:
        raise Falha('Isto não é um plano do Rubrica: falta "rubricaPlano": 1 no topo.')
    passos = plano.get("passos")
    if not isinstance(passos, list) or not passos:
        raise Falha('O plano precisa de uma lista "passos" com pelo menos um passo.')
    so_pt = bool(plano.get("soPt"))
    erros, vistos = [], set()
    for n, p in enumerate(passos, 1):
        onde = f"passo {n}"
        if not isinstance(p, dict):
            erros.append(f"{onde}: precisa ser um objeto")
            continue
        acao = p.get("acao")
        if p.get("id"):
            onde = f"passo {n} ({p['id']})"
            if p["id"] in vistos:
                erros.append(f"{onde}: id repetido")
        for r in _refs_usadas({k: v for k, v in p.items() if k != "id"}):
            if r not in vistos:
                erros.append(f"{onde}: usa {{{{{r}...}}}}, mas nenhum passo anterior tem id '{r}'")
        if p.get("id"):
            vistos.add(p["id"])
        if acao not in ACOES_PLANO:
            erros.append(f"{onde}: acao {acao!r} desconhecida (use {', '.join(ACOES_PLANO)})")
            continue
        for campo in ("arquivo", "enArquivo"):
            if p.get(campo) and not os.path.isfile(_caminho_plano(base, p[campo])):
                erros.append(f"{onde}: arquivo não encontrado: {p[campo]}")
        if acao == "textos":
            if not isinstance(p.get("itens"), list) or not p["itens"]:
                erros.append(f"{onde}: textos precisa de itens [{{key, ptBR, enUS}}]")
        elif acao == "config":
            if not isinstance(p.get("itens"), dict) or not p["itens"]:
                erros.append(f"{onde}: config precisa de itens {{chave: valor}}")
        elif acao == "perfil":
            dados = p.get("dados")
            if not isinstance(dados, dict) or not dados:
                erros.append(f"{onde}: perfil precisa de dados {{campo: valor}}")
            else:
                ruins = sorted(set(dados) - CAMPOS_PERFIL)
                if ruins:
                    erros.append(f"{onde}: campos de perfil desconhecidos: {', '.join(ruins)}")
                if "role" in dados and "roleTranslations" not in dados and not so_pt:
                    erros.append(f"{onde}: mudou role sem roleTranslations {{ptBR, enUS}}")
        elif acao == "home":
            if not p.get("chave") or "valor" not in p:
                erros.append(f"{onde}: home precisa de chave e valor")
            elif str(p["chave"]).startswith("plugin:"):
                erros.append(f"{onde}: plugins não entram em plano")
        elif acao == "imagem":
            if not p.get("arquivo"):
                erros.append(f"{onde}: imagem precisa de arquivo")
            if not p.get("alt"):
                erros.append(f"{onde}: imagem precisa de alt (texto alternativo)")
        elif acao == "post-criar":
            for campo in ("titulo", "slug", "arquivo"):
                if not p.get(campo):
                    erros.append(f"{onde}: post-criar precisa de {campo}")
            if p.get("tags") is not None and not isinstance(p["tags"], (list, str)):
                erros.append(f"{onde}: tags precisa ser lista ou texto separado por vírgulas")
            if p.get("slug") and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", str(p["slug"])):
                erros.append(f"{onde}: slug precisa ser kebab-case sem acentos ({p['slug']!r})")
            if not so_pt:
                faltam = [en for pt, en in (("titulo", "enTitulo"), ("arquivo", "enArquivo"),
                                            ("subtitulo", "enSubtitulo")) if p.get(pt) and not p.get(en)]
                if faltam:
                    erros.append(f"{onde}: faltou a versão em inglês: {', '.join(faltam)}")
        elif acao == "mutation":
            funcao = p.get("funcao") or ""
            if not re.fullmatch(r"[A-Za-z0-9_/]+:[A-Za-z0-9_]+", funcao):
                erros.append(f"{onde}: funcao precisa ser modulo:funcao, veio {funcao!r}")
            elif PLANO_PROIBIDAS.search(funcao):
                erros.append(f"{onde}: {funcao} não entra em plano (acesso, pagamento, tradutor pago ou plugin): "
                             "faça direto, com o pedido explícito da pessoa")
            elif _mutation_existe(funcao) is False:
                erros.append(f"{onde}: {funcao} não existe como mutation em convex/ (veja `funcoes --modulo`)")
            if not isinstance(p.get("args", {}), dict):
                erros.append(f"{onde}: args precisa ser um objeto")
            elif not so_pt:
                faltas = _faltas_ingles(p.get("args") or {})
                if faltas:
                    erros.append(f"{onde}: faltou enUS em {', '.join(faltas)}")
            ler = p.get("ler")
            if ler is not None and (not isinstance(ler, dict) or not ler.get("funcao")):
                erros.append(f"{onde}: ler precisa ser {{funcao, args}} de uma query")
    if erros:
        raise Falha("Plano inválido, nada foi gravado:\n  - " + "\n  - ".join(erros))
    return passos, so_pt


def _previa_passo(p, base, so_pt, refs, slugs):
    """Valida o passo contra o Convex e devolve {antes, depois} sem gravar."""
    acao = p["acao"]
    q = lambda v: _resolver_refs(v, refs, pendente_ok=True)
    if acao == "textos":
        feitos = _aplicar_textos(q(p["itens"]), so_pt, gravar=False)
        return {"alterados": [{"key": f["key"], "antes": f["antes"], "depois": f["depois"]} for f in feitos]}
    if acao == "config":
        itens = [{"key": k, "value": v} for k, v in q(p["itens"]).items()]
        itens, atual, pares = _validar_config(itens, bool(p.get("aceitarContraste")))
        return {"alterado": {i["key"]: {"antes": atual.get(i["key"]), "depois": i["value"]} for i in itens},
                **({"contrasteTextoFundo": dict(pares)} if pares else {})}
    if acao == "perfil":
        atual = chamar("query", "contactInfo:get") or {}
        return {"alterado": {k: {"antes": atual.get(k), "depois": v} for k, v in q(p["dados"]).items()}}
    if acao == "home":
        antes = chamar("query", "homeContent:getByKey", {"key": p["chave"]})
        return {"chave": p["chave"], "antes": (antes or {}).get("value"), "depois": q(p["valor"])}
    if acao == "imagem":
        caminho = _caminho_plano(base, p["arquivo"])
        tam = os.path.getsize(caminho) if os.path.isfile(caminho) else 0
        if tam > LIMITE_IMAGEM:
            raise Falha(f"{p['arquivo']} tem {tam / 1048576:.1f} MB; o limite é 10 MB.")
        return {"sobe": p["arquivo"], "alt": p.get("alt"), "bytes": tam}
    if acao == "post-criar":
        if p["slug"] in slugs:
            raise Falha(f"Já existe um post com o slug {p['slug']!r}. Troque o slug ou edite o post existente.")
        slugs.add(p["slug"])
        corpo = ler_arquivo(_caminho_plano(base, p["arquivo"]))
        return {"novoRascunho": {"titulo": p["titulo"], "enTitulo": p.get("enTitulo"), "slug": p["slug"],
                                 "subtitulo": p.get("subtitulo"), "tags": _tags(p.get("tags")),
                                 "capa": q(p.get("imagemId")),
                                 "palavras": len(re.sub(r"<[^>]+>", " ", corpo).split())}}
    # mutation
    antes = None
    if p.get("ler"):
        antes = chamar("query", p["ler"]["funcao"], q(p["ler"].get("args") or {}))
    return {"funcao": p["funcao"], "antes": antes, "depois": q(p.get("args") or {})}


def _executar_passo(p, base, so_pt, refs):
    """Grava um passo (já validado). Devolve o que os passos seguintes podem referenciar."""
    acao = p["acao"]
    r = lambda v: _resolver_refs(v, refs)
    if acao == "textos":
        _aplicar_textos(r(p["itens"]), so_pt)
        return {}
    if acao == "config":
        itens = [{"key": k, "value": v} for k, v in r(p["itens"]).items()]
        itens, _, _ = _validar_config(itens, bool(p.get("aceitarContraste")))
        chamar("mutation", "siteConfig:setBatch", {"items": itens})
        return {}
    if acao == "perfil":
        chamar("mutation", "contactInfo:update", r(p["dados"]))
        return {}
    if acao == "home":
        chamar("mutation", "homeContent:set", {"key": p["chave"], "value": r(p["valor"])})
        return {}
    if acao == "imagem":
        tags = p.get("tags")
        img = subir_imagem(_caminho_plano(base, p["arquivo"]), nome=p.get("nome"), alt=p.get("alt"),
                           tags=",".join(tags) if isinstance(tags, list) else tags, pasta=p.get("pasta"))
        return {k: img[k] for k in ("id", "storageId", "url") if img.get(k)}
    if acao == "post-criar":
        conteudo = _trocar_no_arquivo(ler_arquivo(_caminho_plano(base, p["arquivo"])), refs)
        args = {"title": p["titulo"], "slug": p["slug"], "content": conteudo,
                "tags": _tags(p.get("tags")), "featured": bool(p.get("destaque")), "status": "draft"}
        if p.get("subtitulo"):
            args["subtitle"] = p["subtitulo"]
        if p.get("leitura"):
            args["readTime"] = p["leitura"]
        if p.get("imagemId"):
            args["imageId"] = r(p["imagemId"])
        if p.get("enTitulo"):
            args["titleTranslations"] = {"ptBR": p["titulo"], "enUS": p["enTitulo"]}
        if p.get("enSubtitulo"):
            args["subtitleTranslations"] = {"ptBR": p.get("subtitulo") or "", "enUS": p["enSubtitulo"]}
        if p.get("enArquivo"):
            args["contentTranslations"] = {"ptBR": conteudo,
                                           "enUS": _trocar_no_arquivo(
                                               ler_arquivo(_caminho_plano(base, p["enArquivo"])), refs)}
        return {"id": chamar("mutation", "posts:create", args), "slug": p["slug"]}
    valor = chamar("mutation", p["funcao"], r(p.get("args") or {}))
    return {"resultado": valor} if valor is not None else {}


def c_aplicar_plano(a):
    caminho = os.path.abspath(a.plano)
    base = os.path.dirname(caminho)
    plano = ler_json(caminho)
    passos, so_pt = _validar_estrutura_plano(plano, base)
    destino = convex()[0]
    if plano.get("convex") and plano["convex"].rstrip("/") != destino.rstrip("/"):
        raise Falha(f"O plano foi feito para {plano['convex']}, mas o Convex agora é {destino}. "
                    "Nada foi gravado. Confira o RUBRICA_CONVEX_URL ou refaça o plano.")
    progresso_arq = caminho + ".resultado.json"
    feitos, refs, anteriores = set(), {}, []
    if a.retomar:
        if not os.path.isfile(progresso_arq):
            raise Falha(f"Não há progresso salvo ({os.path.basename(progresso_arq)}): rode sem --retomar.")
        prog = ler_json(progresso_arq)
        anteriores = [x for x in prog.get("passos", []) if x.get("ok")]
        feitos = {x["n"] for x in anteriores}
        refs = prog.get("refs") or {}
    elif os.path.isfile(progresso_arq) and not a.verificar:
        raise Falha(f"Este plano já foi aplicado, ao menos em parte ({os.path.basename(progresso_arq)}). "
                    "Use --retomar para continuar de onde parou, ou apague o arquivo de progresso para "
                    "aplicar tudo de novo (pode duplicar posts e projetos).")

    # Valida todos os passos contra o Convex antes de gravar qualquer coisa.
    slugs = set()
    if any(p["acao"] == "post-criar" for p in passos):
        slugs = {x.get("slug") for x in (chamar("query", "posts:listAdmin", {"limit": 200}) or [])
                 if isinstance(x, dict)}
    previas = []
    for n, p in enumerate(passos, 1):
        if n in feitos:
            previas.append({"n": n, "id": p.get("id"), "acao": p["acao"], "jaFeito": True})
            continue
        try:
            prev = _previa_passo(p, base, so_pt, refs, slugs)
        except Falha as e:
            raise Falha(f"Passo {n} ({p.get('descricao') or p['acao']}): {e} Nada foi gravado.", e.codigo)
        previas.append({"n": n, "id": p.get("id"), "acao": p["acao"], "descricao": p.get("descricao"), **prev})

    cabeca = {"plano": os.path.relpath(caminho), "origem": plano.get("origem"), "resumo": plano.get("resumo"),
              "convex": destino, "ambiente": ambiente()}
    if a.verificar:
        saida({"ok": True, "modo": "verificacao", **cabeca, "passos": previas,
               "aviso": "Nada foi gravado. Mostre o antes/depois à pessoa e só aplique com o ok dela."})
        return

    registro = {"plano": cabeca["plano"], "convex": destino, "passos": anteriores, "refs": refs}

    def salvar():
        with open(progresso_arq, "w", encoding="utf-8") as f:
            json.dump(registro, f, ensure_ascii=False, indent=2)

    for n, p in enumerate(passos, 1):
        if n in feitos:
            continue
        try:
            res = _executar_passo(p, base, so_pt, refs)
        except Falha as e:
            registro["passos"].append({"n": n, "id": p.get("id"), "acao": p["acao"], "ok": False, "erro": str(e)})
            salvar()
            raise Falha(f"Passo {n} ({p.get('descricao') or p['acao']}) falhou: {e}\n"
                        f"Os passos anteriores já foram gravados (veja {os.path.basename(progresso_arq)}). "
                        "Corrija o plano e rode de novo com --retomar.", e.codigo)
        if p.get("id"):
            refs[p["id"]] = res
        registro["passos"].append({"n": n, "id": p.get("id"), "acao": p["acao"], "ok": True, **res})
        salvar()
    saida({"ok": True, "modo": "aplicado", **cabeca, "resultados": registro["passos"],
           "progresso": os.path.relpath(progresso_arq),
           "aviso": "Gravado. Posts nascem rascunho. Textos fixos e cores valem na hora; perfil, blocos da "
                    "home, SEO, projetos, currículo e posts entram no site no próximo publicar-site "
                    "(só com pedido da pessoa)."})


# ------------------------------------------------------------------ CLI

def parser():
    p = argparse.ArgumentParser(prog="rubrica", description="Conteúdo de um site Rubrica pela CLI.")
    sub = p.add_subparsers(dest="cmd", required=True, metavar="subcomando")

    def cmd(nome, fn, ajuda):
        sp = sub.add_parser(nome, help=ajuda)
        sp.set_defaults(fn=fn)
        return sp

    sp = cmd("login", c_login, "entra com e-mail e senha do admin (pede a senha no terminal)")
    sp.add_argument("--email")
    sp.add_argument("--senha-stdin", action="store_true", help="lê a senha da primeira linha do stdin")
    cmd("status", c_status, "projeto, Convex, site, conta e publicação pendente")
    cmd("logout", c_logout, "encerra a sessão deste Convex")
    cmd("painel", c_painel, "números do dashboard + contatos novos + depoimentos pendentes")

    sp = cmd("listar", c_listar, "lista itens de um tipo")
    sp.add_argument("tipo", choices=sorted(TIPOS))
    sp.add_argument("--status", help="filtro de status (contatos, envios, checkouts; propostas: all|accepted|pending)")
    sp.add_argument("--texto", help="filtra pelo texto em qualquer campo")
    sp.add_argument("--lixeira", action="store_true", help="inclui itens apagados (soft delete)")
    sp.add_argument("--limite", type=int, default=50)
    sp.add_argument("--completo", action="store_true", help="sem encurtar campos")

    sp = cmd("ler", c_ler, "um item completo")
    sp.add_argument("tipo", choices=sorted(TIPOS))
    sp.add_argument("ref", help="slug (posts), id, uniqueLink (checkouts) ou key (home)")

    sp = cmd("textos", c_textos, "textos fixos do site (botões, títulos, rótulos) em pt-BR e en-US")
    sp.add_argument("--paginas", action="store_true", help="só o resumo por página")
    sp.add_argument("--pagina", help="ex.: home, navigation, blog, contactWizard")
    sp.add_argument("--chave", help="prefixo da chave, ex.: home.hero")
    sp.add_argument("--texto", help="procura no texto pt-BR/en-US ou na chave")
    sp.add_argument("--sem-ingles", action="store_true", help="só os que estão sem en-US")
    sp.add_argument("--limite", type=int, default=100)

    sp = cmd("texto-editar", c_texto_editar, "muda um texto do site (pt-BR + en-US)")
    sp.add_argument("chave")
    sp.add_argument("--pt", required=True)
    sp.add_argument("--en")
    sp.add_argument("--so-pt", action="store_true", help="grava só o pt-BR (mantém o en-US antigo)")

    sp = cmd("textos-editar", c_textos_editar, "muda vários textos de uma vez a partir de um JSON")
    sp.add_argument("--arquivo", required=True, help='lista [{"key","ptBR","enUS"}]')
    sp.add_argument("--so-pt", action="store_true")

    cmd("config", c_config, "identidade, SEO, RSS, cores e fontes do site")
    sp = cmd("config-definir", c_config_definir, "muda chaves da configuração do site")
    sp.add_argument("--item", action="append", help="chave=valor (repetível)")
    sp.add_argument("--arquivo", help="JSON {chave: valor} ou [{key, value}]")
    sp.add_argument("--aceitar-contraste", action="store_true", help="grava mesmo com contraste abaixo de 4.5:1")

    sp = cmd("og-imagem", c_og_imagem, "troca a imagem de compartilhamento (redes sociais)")
    sp.add_argument("arquivo")
    sp.add_argument("--nome")
    sp.add_argument("--alt")

    cmd("perfil", c_perfil, "nome, cargo, contatos e redes do dono do site")
    sp = cmd("perfil-editar", c_perfil_editar, "muda campos do perfil")
    sp.add_argument("--json", help='ex.: {"location": "Lisboa"}')
    sp.add_argument("--arquivo")
    sp.add_argument("--so-pt", action="store_true")

    sp = cmd("home-definir", c_home_definir, "muda um bloco da home (hero_title, about_text, hero_tags...)")
    sp.add_argument("chave")
    sp.add_argument("--valor", help="valor em JSON (texto entre aspas: '\"Olá\"')")
    sp.add_argument("--arquivo", help="arquivo com o valor em JSON")

    cmd("plugins", c_plugins, "quais recursos (blog, propostas, i18n...) estão ligados")
    sp = cmd("plugin", c_plugin, "liga ou desliga um plugin (só com confirmação)")
    sp.add_argument("id")
    sp.add_argument("acao", choices=("ligar", "desligar"))

    sp = cmd("post-criar", c_post_criar, "cria post em rascunho a partir de um HTML")
    sp.add_argument("--titulo", required=True)
    sp.add_argument("--slug", required=True)
    sp.add_argument("--arquivo", required=True, help="HTML do corpo (pt-BR)")
    sp.add_argument("--subtitulo")
    sp.add_argument("--tags", help="separadas por vírgula")
    sp.add_argument("--destaque", action="store_true")
    sp.add_argument("--imagem-url")
    sp.add_argument("--imagem-id", help="capa: id de uma imagem da biblioteca")
    sp.add_argument("--capa", help="capa: arquivo local, sobe e usa como capa")
    sp.add_argument("--capa-alt")
    sp.add_argument("--leitura", help='tempo de leitura, ex.: "5 min"')
    sp.add_argument("--en-titulo")
    sp.add_argument("--en-subtitulo")
    sp.add_argument("--en-arquivo", help="HTML do corpo em inglês")
    sp.add_argument("--so-pt", action="store_true")

    sp = cmd("post-editar", c_post_editar, "edita campos de um post")
    sp.add_argument("id")
    sp.add_argument("--titulo")
    sp.add_argument("--subtitulo")
    sp.add_argument("--slug")
    sp.add_argument("--arquivo")
    sp.add_argument("--tags", help="substitui TODAS as tags")
    sp.add_argument("--destaque", choices=("sim", "nao"))
    sp.add_argument("--imagem-url")
    sp.add_argument("--imagem-id")
    sp.add_argument("--capa")
    sp.add_argument("--capa-alt")
    sp.add_argument("--leitura")
    sp.add_argument("--en-titulo")
    sp.add_argument("--en-arquivo")
    sp.add_argument("--en-subtitulo")
    sp.add_argument("--so-pt", action="store_true")

    for nome in ("post-publicar", "post-despublicar"):
        cmd(nome, c_post_status, "muda o status do post (published/draft)").add_argument("id")

    sp = cmd("imagem-subir", c_imagem_subir, "sobe imagens para a biblioteca do admin")
    sp.add_argument("arquivos", nargs="+")
    sp.add_argument("--nome")
    sp.add_argument("--alt")
    sp.add_argument("--descricao")
    sp.add_argument("--tags")
    sp.add_argument("--pasta", help="id da pasta (listar pastas)")

    sp = cmd("contato", c_contato, "muda status e/ou anota num pedido de contato")
    sp.add_argument("id")
    sp.add_argument("--status", choices=("new", "read", "contacted", "in_progress", "closed", "archived"))
    sp.add_argument("--nota")

    sp = cmd("publicar-site", c_publicar_site, "dispara o rebuild do site (só com confirmação)")
    sp.add_argument("--verificar", action="store_true", help="só mostra se há mudanças pendentes")

    sp = cmd("chamar", c_chamar, "chama qualquer função do Convex (query|mutation|action)")
    sp.add_argument("tipo", choices=("query", "mutation", "action"))
    sp.add_argument("caminho", help="modulo:funcao, ex.: projects:update")
    sp.add_argument("--args", help="JSON")
    sp.add_argument("--args-arquivo", help="arquivo com o JSON")

    sp = cmd("aplicar-plano", c_aplicar_plano, "aplica um plano JSON das skills rubrica-* (valida tudo antes)")
    sp.add_argument("plano", help="arquivo do plano (ex.: .rubrica/planos/2026-10-24-case-x/plano.json)")
    sp.add_argument("--verificar", action="store_true", help="só valida e mostra o antes/depois, sem gravar")
    sp.add_argument("--retomar", action="store_true", help="pula os passos já gravados numa execução que falhou")

    sp = cmd("funcoes", c_funcoes, "lista funções do Convex do projeto (com --modulo mostra os args)")
    sp.add_argument("--modulo")
    return p


def main():
    a = parser().parse_args()
    try:
        a.fn(a)
    except Falha as e:
        sys.stderr.write(f"✗ {e}\n")
        sys.exit(e.codigo)
    except KeyboardInterrupt:
        sys.exit(130)


if __name__ == "__main__":
    main()
