"""Testes da escolha do Convex: desenvolvimento (.env.local) ou produção (rubrica.json).

Rode da raiz do projeto: python3 -m unittest discover -s .agents/skills/rubrica/tests
"""
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

DEV = "https://dev-gato-123.convex.cloud"
PROD = "https://prod-onca-456.convex.cloud"


class ProjetoFalso:
    """Pasta de projeto com rubrica.config.ts, .env.local de dev e, se quiser, a produção no rubrica.json."""

    def __init__(self, com_producao=True):
        self.tmp = tempfile.TemporaryDirectory()
        self.raiz = self.tmp.name
        with open(os.path.join(self.raiz, "rubrica.config.ts"), "w") as f:
            f.write('export default { siteUrl: "https://meusite.com" }\n')
        with open(os.path.join(self.raiz, ".env.local"), "w") as f:
            f.write(f"CONVEX_DEPLOYMENT=dev:dev-gato-123 # team: x\nVITE_CONVEX_URL={DEV}\n")
        estado = {"version": "1.4.1", "layout": "zine"}
        if com_producao:
            estado["producao"] = {"convexUrl": PROD, "siteUrl": "https://meusite.vercel.app"}
        with open(os.path.join(self.raiz, "rubrica.json"), "w") as f:
            json.dump(estado, f)

    def fechar(self):
        self.tmp.cleanup()


class BaseAmbiente(unittest.TestCase):
    com_producao = True

    def setUp(self):
        self.projeto = ProjetoFalso(self.com_producao)
        self.env = mock.patch.dict(os.environ, {"RUBRICA_PROJECT": self.projeto.raiz}, clear=False)
        self.env.start()
        for var in ("RUBRICA_CONVEX_URL", "RUBRICA_AMBIENTE"):
            os.environ.pop(var, None)
        rubrica._CONVEX = None
        rubrica._AMBIENTE = None
        rubrica._PRODUCAO = False

    def tearDown(self):
        self.env.stop()
        self.projeto.fechar()
        rubrica._CONVEX = None
        rubrica._AMBIENTE = None
        rubrica._PRODUCAO = False


class EscolhaDoConvex(BaseAmbiente):
    def test_sem_pedido_usa_o_dev_do_env_local(self):
        self.assertEqual(rubrica.convex()[0], DEV)
        self.assertEqual(rubrica.ambiente(), "desenvolvimento")

    def test_flag_producao_usa_a_url_gravada_pelo_publicar(self):
        rubrica.pedir_producao()
        url, origem = rubrica.convex()
        self.assertEqual(url, PROD)
        self.assertIn("rubrica.json", origem)
        self.assertEqual(rubrica.ambiente(), "produção")

    def test_variavel_rubrica_ambiente_tambem_pede_producao(self):
        os.environ["RUBRICA_AMBIENTE"] = "producao"
        self.assertEqual(rubrica.convex()[0], PROD)

    def test_rubrica_convex_url_vence_tudo(self):
        os.environ["RUBRICA_CONVEX_URL"] = "https://outro-789.convex.cloud/"
        rubrica.pedir_producao()
        self.assertEqual(rubrica.convex()[0], "https://outro-789.convex.cloud")

    def test_subcomando_aceita_producao(self):
        a = rubrica.parser().parse_args(["status", "--producao"])
        self.assertTrue(a.producao)
        a = rubrica.parser().parse_args(["login", "--producao", "--email", "a@b.com"])
        self.assertTrue(a.producao)
        self.assertFalse(rubrica.parser().parse_args(["status"]).producao)

    def test_url_de_producao_conhecida(self):
        self.assertEqual(rubrica.url_producao(), PROD)

    def test_status_em_dev_avisa_como_mexer_no_site_publicado(self):
        out = io.StringIO()
        with redirect_stdout(out), mock.patch.object(rubrica, "url_site", return_value=None):
            rubrica.c_status(rubrica.parser().parse_args(["status"]))
        dados = json.loads(out.getvalue())
        self.assertEqual(dados["producao"], PROD)
        self.assertIn("--producao", dados["aviso"])


class SemProducaoGravada(BaseAmbiente):
    com_producao = False

    def test_pedir_producao_sem_publicar_explica_o_que_fazer(self):
        rubrica.pedir_producao()
        with self.assertRaises(rubrica.Falha) as ctx:
            rubrica.convex()
        self.assertEqual(ctx.exception.codigo, 3)
        self.assertIn("npx create-rubrica publicar", str(ctx.exception))
        self.assertIn("RUBRICA_CONVEX_URL", str(ctx.exception))

    def test_status_em_dev_sem_producao_mantem_o_aviso_antigo(self):
        out = io.StringIO()
        with redirect_stdout(out), mock.patch.object(rubrica, "url_site", return_value=None):
            rubrica.c_status(rubrica.parser().parse_args(["status"]))
        dados = json.loads(out.getvalue())
        self.assertNotIn("producao", dados)
        self.assertIn("RUBRICA_CONVEX_URL", dados["aviso"])


class LoginPerguntaOnde(BaseAmbiente):
    def _login(self, argv, escolha):
        a = rubrica.parser().parse_args(argv)
        chamadas = []

        def post(tipo, caminho, args):
            chamadas.append(rubrica.convex()[0])
            return 200, {"token": "t", "refreshToken": "r"}

        out = io.StringIO()
        with mock.patch.object(rubrica, "_post", side_effect=post), \
                mock.patch.object(rubrica, "_tokens", side_effect=lambda r: r), \
                mock.patch.object(rubrica, "gravar_sessao"), \
                mock.patch.object(rubrica, "chamar", return_value={"role": "root"}), \
                mock.patch.object(rubrica.sys.stdin, "isatty", return_value=True), \
                mock.patch.object(rubrica.getpass, "getpass", return_value="Senha-Forte-123"), \
                mock.patch("builtins.input", side_effect=[escolha]) as perguntou, \
                redirect_stdout(out):
            rubrica.c_login(a)
        return chamadas, json.loads(out.getvalue()), perguntou

    def test_pergunta_e_entra_no_site_publicado(self):
        chamadas, saida, perguntou = self._login(["login", "--email", "a@b.com"], "1")
        self.assertEqual(perguntou.call_count, 1)
        self.assertEqual(chamadas, [PROD])
        self.assertEqual(saida["ambiente"], "produção")
        self.assertIn("--producao", saida["aviso"])

    def test_pergunta_e_entra_no_do_computador(self):
        chamadas, saida, _ = self._login(["login", "--email", "a@b.com"], "2")
        self.assertEqual(chamadas, [DEV])
        self.assertEqual(saida["ambiente"], "desenvolvimento")

    def test_com_producao_explicita_nao_pergunta(self):
        chamadas, _, perguntou = self._login(["login", "--producao", "--email", "a@b.com"], "x")
        self.assertEqual(perguntou.call_count, 0)
        self.assertEqual(chamadas, [PROD])


if __name__ == "__main__":
    unittest.main()
