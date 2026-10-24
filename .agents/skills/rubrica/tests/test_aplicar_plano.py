"""Testes do aplicar-plano com um Convex de mentira.

Rode da raiz do projeto: python3 -m unittest discover -s .agents/skills/rubrica/tests
"""
import argparse
import io
import json
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import rubrica  # noqa: E402

CONVEX = "https://teste-123.convex.cloud"


class ConvexFalso:
    """Guarda o estado mínimo e registra as mutations recebidas."""

    def __init__(self):
        self.textos = [{"key": "home.hero.cta", "ptBR": "Fale comigo", "enUS": "Talk to me"}]
        self.home = {"about_text": {"ptBR": "antigo", "enUS": "old"}}
        self.posts = [{"slug": "ja-existe"}]
        self.mutations = []
        self.falhar_em = None

    def chamar(self, tipo, caminho, args=None, _tentativa=0):
        args = args or {}
        if tipo == "query":
            return {
                "siteTexts:getAll": lambda: self.textos,
                "homeContent:getByKey": lambda: {"value": self.home.get(args["key"])},
                "posts:listAdmin": lambda: self.posts,
                "projects:getById": lambda: {"_id": args["id"], "title": "Projeto"},
                "contactInfo:get": lambda: {"role": "Dev"},
                "siteConfig:getAll": lambda: [],
            }[caminho]()
        if caminho == self.falhar_em:
            raise rubrica.Falha("servidor recusou")
        self.mutations.append((caminho, args))
        if caminho == "posts:create":
            return "post_1"
        if caminho == "projects:create":
            return "proj_1"
        return None


class AplicarPlanoTeste(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.cx = ConvexFalso()
        for alvo, valor in (("chamar", self.cx.chamar), ("convex", lambda: (CONVEX, "teste")),
                            ("ambiente", lambda: "desenvolvimento"), ("chaves_publicas_config", lambda: None)):
            p = mock.patch.object(rubrica, alvo, valor)
            p.start()
            self.addCleanup(p.stop)
        self.escrever("corpo.html", "<p>Olá {{proj.resultado}}</p><code>{{user.name}}</code>")
        self.escrever("corpo-en.html", "<p>Hello</p>")

    def escrever(self, nome, conteudo):
        with open(os.path.join(self.tmp, nome), "w", encoding="utf-8") as f:
            f.write(conteudo)

    def plano(self, passos, **extra):
        caminho = os.path.join(self.tmp, "plano.json")
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump({"rubricaPlano": 1, "origem": "teste", "passos": passos, **extra}, f)
        return caminho

    def rodar(self, caminho, verificar=False, retomar=False):
        buf = io.StringIO()
        with redirect_stdout(buf):
            rubrica.c_aplicar_plano(argparse.Namespace(plano=caminho, verificar=verificar, retomar=retomar))
        return json.loads(buf.getvalue())

    PASSOS = [
        {"acao": "textos", "itens": [{"key": "home.hero.cta", "ptBR": "Vamos conversar", "enUS": "Let's talk"}]},
        {"acao": "home", "chave": "about_text", "valor": {"ptBR": "novo", "enUS": "new"}},
        {"id": "proj", "acao": "mutation", "funcao": "projects:create", "args": {"title": "X"}},
        {"acao": "post-criar", "titulo": "Título", "enTitulo": "Title", "slug": "novo-post",
         "arquivo": "corpo.html", "enArquivo": "corpo-en.html"},
    ]

    def test_verificar_nao_grava_e_mostra_antes_depois(self):
        res = self.rodar(self.plano(self.PASSOS), verificar=True)
        self.assertEqual(self.cx.mutations, [])
        self.assertEqual(res["modo"], "verificacao")
        self.assertEqual(res["passos"][0]["alterados"][0]["antes"]["ptBR"], "Fale comigo")
        self.assertEqual(res["passos"][1]["antes"], {"ptBR": "antigo", "enUS": "old"})

    def test_aplica_em_ordem_e_resolve_referencias(self):
        self.rodar(self.plano(self.PASSOS))
        nomes = [m[0] for m in self.cx.mutations]
        self.assertEqual(nomes, ["siteTexts:update", "homeContent:set", "projects:create", "posts:create"])
        post = self.cx.mutations[-1][1]
        self.assertEqual(post["content"], "<p>Olá proj_1</p><code>{{user.name}}</code>")
        self.assertEqual(post["status"], "draft")
        self.assertEqual(post["titleTranslations"], {"ptBR": "Título", "enUS": "Title"})

    def test_plano_de_outro_convex_e_recusado(self):
        with self.assertRaises(rubrica.Falha) as e:
            self.rodar(self.plano(self.PASSOS, convex="https://outro.convex.cloud"))
        self.assertIn("Nada foi gravado", str(e.exception))
        self.assertEqual(self.cx.mutations, [])

    def test_erro_de_validacao_em_qualquer_passo_bloqueia_tudo(self):
        passos = self.PASSOS + [{"acao": "post-criar", "titulo": "Dup", "enTitulo": "Dup", "slug": "ja-existe",
                                 "arquivo": "corpo.html", "enArquivo": "corpo-en.html"}]
        with self.assertRaises(rubrica.Falha):
            self.rodar(self.plano(passos))
        self.assertEqual(self.cx.mutations, [])

    def test_falta_ingles_e_funcoes_proibidas(self):
        passos = [{"acao": "post-criar", "titulo": "T", "slug": "t", "arquivo": "corpo.html"},
                  {"acao": "mutation", "funcao": "users:setRole", "args": {}},
                  {"acao": "mutation", "funcao": "translation:translateBatch", "args": {}},
                  {"acao": "home", "chave": "x", "valor": "{{nada.id}}"}]
        with self.assertRaises(rubrica.Falha) as e:
            self.rodar(self.plano(passos))
        msg = str(e.exception)
        for trecho in ("enTitulo", "users:setRole", "translateBatch", "nada"):
            self.assertIn(trecho, msg)

    def test_mutation_inexistente_e_traducao_sem_ingles_sao_recusadas(self):
        passos = [{"acao": "mutation", "funcao": "projects:naoExiste", "args": {}},
                  {"acao": "mutation", "funcao": "projects:create",
                   "args": {"title": "X", "titleTranslations": {"ptBR": "X"}}}]
        with self.assertRaises(rubrica.Falha) as e:
            self.rodar(self.plano(passos))
        msg = str(e.exception)
        self.assertIn("projects:naoExiste", msg)
        self.assertIn("titleTranslations", msg)

    def test_tags_aceitam_texto_separado_por_virgulas(self):
        passos = [{"acao": "post-criar", "titulo": "T", "enTitulo": "T", "slug": "t", "tags": "React, Convex",
                   "arquivo": "corpo.html", "enArquivo": "corpo-en.html"}]
        self.rodar(self.plano(passos))
        self.assertEqual(self.cx.mutations[-1][1]["tags"], ["React", "Convex"])

    def test_falha_no_meio_salva_progresso_e_retomar_continua(self):
        caminho = self.plano(self.PASSOS)
        self.cx.falhar_em = "posts:create"
        with self.assertRaises(rubrica.Falha) as e:
            self.rodar(caminho)
        self.assertIn("--retomar", str(e.exception))
        self.assertEqual(len(self.cx.mutations), 3)
        # Rodar de novo sem --retomar duplicaria o projeto: é recusado.
        with self.assertRaises(rubrica.Falha):
            self.rodar(caminho)
        self.cx.falhar_em = None
        self.rodar(caminho, retomar=True)
        nomes = [m[0] for m in self.cx.mutations]
        self.assertEqual(nomes.count("projects:create"), 1)
        self.assertEqual(self.cx.mutations[-1][1]["content"], "<p>Olá proj_1</p><code>{{user.name}}</code>")


if __name__ == "__main__":
    unittest.main()
